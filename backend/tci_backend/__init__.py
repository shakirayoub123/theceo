# Compatibility fix for Python 3.14 + Django 4.2 BaseContext.__copy__
try:
    from django.template import context as _django_context

    def _fixed_base_context_copy(self):
        duplicate = self.__class__.__new__(self.__class__)
        duplicate.__dict__.update(self.__dict__)
        duplicate.dicts = self.dicts[:]
        return duplicate

    _django_context.BaseContext.__copy__ = _fixed_base_context_copy
except Exception:
    pass
