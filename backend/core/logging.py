import logging
import re

SENSITIVE_PATTERNS = [
    re.compile(r'(sk_(?:live|test)_)[A-Za-z0-9]+', re.IGNORECASE),
    re.compile(r'(pk_(?:live|test)_)[A-Za-z0-9]+', re.IGNORECASE),
    re.compile(r'("password"\s*:\s*")[^"]+(")', re.IGNORECASE),
    re.compile(r'(\d{4}[\s-]?)(\d{4}[\s-]?\d{4}[\s-]?\d{1,4})'),
    re.compile(r'("secret_key[^"]*"\s*:\s*")[^"]+(")', re.IGNORECASE),
    re.compile(r'("cvv"\s*:\s*")[^"]+(")', re.IGNORECASE),
]


class MaskSensitiveFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = self._mask(str(record.msg))
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self._mask(str(v)) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self._mask(str(a)) for a in record.args)
        return True

    def _mask(self, text: str) -> str:
        for pattern in SENSITIVE_PATTERNS:
            text = pattern.sub(r'\1[REDACTED]', text)
        return text
