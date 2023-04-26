/* global axios */

import ApiClient from './ApiClient';

class IntegrationsAPI extends ApiClient {
  constructor() {
    super('integrations/apps', { accountScoped: true });
  }

  connectSlack(code) {

    return axios.post(`${this.baseUrl()}/integrations/slack`, {
      code: code,
    });
  }

  delete(integrationId) {
    return axios.delete(`${this.baseUrl()}/integrations/${integrationId}`);
  }

  createHook(hookData) {
    return axios.post(`${this.baseUrl()}/integrations/hooks`, hookData);
  }

  deleteHook(hookId) {
    return axios.delete(`${this.baseUrl()}/integrations/hooks/${hookId}`);
  }

  createChatGPT(hookData) {
    return axios.post(`${this.baseUrl()}/integrations/hooks/create_chatgpt`, hookData);
  }

  async uploadFile(params) {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('apiKey', params.apiKey);
      return await axios.post(`${params.openAIUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  }
}

export default new IntegrationsAPI();
