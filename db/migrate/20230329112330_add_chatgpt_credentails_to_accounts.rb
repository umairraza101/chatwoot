class AddChatgptCredentailsToAccounts < ActiveRecord::Migration[6.1]
  def change
    add_column :integrations_hooks, :chatgpt_api_key, :string
    add_column :integrations_hooks, :chatgpt_document_id, :string
  end
end
