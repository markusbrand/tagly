from rest_framework.pagination import PageNumberPagination


class CustomFieldDefinitionPagination(PageNumberPagination):
    """
    Custom field definitions must load in full for onboarding and admin forms.
    The project default PAGE_SIZE (25) hid mandatory fields beyond the first page.
    """

    page_size = 500
    page_size_query_param = "page_size"
    max_page_size = 2000
