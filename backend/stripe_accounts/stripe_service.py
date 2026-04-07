"""
StripeService — all Stripe API calls happen here.
The decrypted secret key never leaves this module.
"""
import logging
import stripe
from core.crypto import decrypt

logger = logging.getLogger(__name__)

STRIPE_ERROR_MAP = {
    'card_declined': 'Cartão recusado. Por favor, verifique os dados ou use outro cartão.',
    'insufficient_funds': 'Saldo insuficiente. Por favor, use outro cartão.',
    'lost_card': 'Cartão reportado como perdido. Transação não autorizada.',
    'stolen_card': 'Cartão reportado como roubado. Transação não autorizada.',
    'expired_card': 'Cartão expirado. Por favor, use um cartão válido.',
    'incorrect_cvc': 'Código de segurança incorreto. Verifique o CVV e tente novamente.',
    'processing_error': 'Erro de processamento. Por favor, tente novamente em instantes.',
    'incorrect_number': 'Número de cartão incorreto. Verifique os dados digitados.',
    'authentication_required': 'Autenticação adicional necessária (3DS). Este tipo de cartão não é suportado no momento.',
}


def _client(secret_key_encrypted: str) -> stripe.StripeClient:
    sk = decrypt(secret_key_encrypted)
    return stripe.StripeClient(sk)


def get_account_info(secret_key: str) -> dict:
    """Fetch identifying info from the Stripe account. Never raises — returns empty dict on failure."""
    try:
        account = stripe.Account.retrieve(api_key=secret_key)
        business_profile = getattr(account, 'business_profile', None)
        company = getattr(account, 'company', None)
        name = (
            (business_profile and getattr(business_profile, 'name', None))
            or (company and getattr(company, 'name', None))
            or ''
        )
        return {
            'stripe_account_id': account.id,
            'account_name': name or '',
            'account_email': account.email or '',
            'charges_enabled': bool(account.charges_enabled),
        }
    except stripe.StripeError as exc:
        logger.warning('Could not fetch Stripe account info: %s', exc)
        return {}


def validate_credentials(publishable_key: str, secret_key: str) -> bool:
    """Test the secret key by retrieving balance. Raises ValueError on failure."""
    if not secret_key.startswith(('sk_live_', 'sk_test_')):
        raise ValueError('Chave secreta inválida. Deve começar com sk_live_ ou sk_test_.')
    if not publishable_key.startswith(('pk_live_', 'pk_test_')):
        raise ValueError('Chave pública inválida. Deve começar com pk_live_ ou pk_test_.')
    try:
        client = stripe.StripeClient(secret_key)
        client.balance.retrieve()
        return True
    except stripe.AuthenticationError:
        raise ValueError('Credenciais Stripe inválidas. Verifique as chaves e tente novamente.')
    except stripe.StripeError as exc:
        raise ValueError(f'Erro ao validar credenciais Stripe: {exc}')


def create_payment_intent(secret_key_encrypted: str, amount_cents: int, idempotency_key: str) -> dict:
    client = _client(secret_key_encrypted)
    intent = client.payment_intents.create(
        params={
            'amount': amount_cents,
            'currency': 'brl',
            'payment_method_types': ['card'],
            'capture_method': 'automatic',
        },
        options={'idempotency_key': idempotency_key},
    )
    return {'id': intent.id, 'client_secret': intent.client_secret, 'status': intent.status}



def update_payment_intent_metadata(secret_key_encrypted: str, payment_intent_id: str, metadata: dict) -> None:
    client = _client(secret_key_encrypted)
    client.payment_intents.update(payment_intent_id, params={'metadata': metadata})


def get_payment_intent_status(secret_key_encrypted: str, payment_intent_id: str) -> dict:
    client = _client(secret_key_encrypted)
    try:
        intent = client.payment_intents.retrieve(
            payment_intent_id,
            params={'expand': ['payment_method']},
        )
        result = {'status': intent.status}
        if intent.status == 'succeeded' and intent.payment_method:
            pm = intent.payment_method
            if hasattr(pm, 'card') and pm.card:
                result['card_last4'] = pm.card.last4
                result['card_brand'] = pm.card.brand.capitalize()
        return result
    except stripe.StripeError as exc:
        logger.error('Stripe polling error: %s', exc)
        return {'status': 'failed'}
