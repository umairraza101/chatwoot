class MessageTemplates::Template::ChatGptConversation
  pattr_initialize [:conversation!]

  def perform
    ActiveRecord::Base.transaction do
      conversation.messages.create!(chat_gpt_response)
    end
  rescue StandardError => e
    ChatwootExceptionTracker.new(e, account: conversation.account).capture_exception
    true
  end

  private

  delegate :contact, :account, to: :conversation
  delegate :inbox, to: :message

  def chat_gpt_response
    content = 'Hi CHATGPT Response'
    {
      account_id: @conversation.account_id,
      inbox_id: @conversation.inbox_id,
      message_type: :chat_gpt,
      content: content
    }
  end
end
