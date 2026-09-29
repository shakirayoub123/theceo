from django.contrib.sitemaps import Sitemap
from .models import Ebook, Blog, Service, Newsletter


class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = 'monthly'

    def items(self):
        return ['home', 'ebooks', 'blogs', 'services', 'about']

    def location(self, item):
        urls = {
            'home': '/',
            'ebooks': '/#ebooks',
            'blogs': '/#blogs',
            'services': '/#services',
            'about': '/#our-team',
        }
        return urls.get(item, '/')


class EbookSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.9

    def items(self):
        return Ebook.objects.filter(status='active')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/ebook-detail/{obj.id}'


class BlogSitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.8

    def items(self):
        return Blog.objects.filter(status='published')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/blog/{obj.slug}'


class ServiceSitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return Service.objects.filter(status='active', is_published=True)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/service/{obj.id}'


class NewsletterSitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Newsletter.objects.filter(status='published')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f'/#newsletter'