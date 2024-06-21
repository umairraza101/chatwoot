json.partial! 'api/v1/models/hook', formats: [:json], resource: @hook
json.chatgpt_api_key @hook.chatgpt_api_key
json.chatgpt_document_id @hook.chatgpt_document_id
