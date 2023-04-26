<template>
  <div class="column content-box">
    <woot-modal-header
      :header-title="integration.name"
      :header-content="integration.description"
    />
    <formulate-form
      #default="{ hasErrors }"
      v-model="values"
      @submit="submitForm"
    >
      <formulate-input
        v-for="item in formItems"
        :key="item.name"
        v-bind="item"
      />
      <formulate-input
        v-if="isHookTypeInbox"
        :options="inboxes"
        type="select"
        name="inbox"
        :placeholder="$t('INTEGRATION_APPS.ADD.FORM.INBOX.LABEL')"
        :label="$t('INTEGRATION_APPS.ADD.FORM.INBOX.PLACEHOLDER')"
        validation="required"
        validation-name="Inbox"
      />
      <div  class="small-11 columns with-right-space">
        <p class="wrap-content">Your file must be a JSONL document, where each line is a prompt-completion pair.</p>
        <input type="file" id="file" name="file" @change="gptFile($event)" accept=".jsonl" class="input-file" />
        <p class="formulate-file-error" v-if="errorMessage">{{ errorMessage }}</p>
      </div>

      <div class="modal-footer">
        <woot-button :disabled="hasErrors" :loading="uiFlags.isCreatingHook">
          {{ $t('INTEGRATION_APPS.ADD.FORM.SUBMIT') }}
        </woot-button>
        <woot-button class="button clear" @click.prevent="onClose">
          {{ $t('INTEGRATION_APPS.ADD.FORM.CANCEL') }}
        </woot-button>
      </div>
    </formulate-form>
  </div>
</template>
<script>
import { mapGetters } from 'vuex';
import alertMixin from 'shared/mixins/alertMixin';
import hookMixin from './hookMixin';
import Input from "../../../../../widget/components/Form/Input.vue";

export default {
    components: {Input},
  mixins: [alertMixin, hookMixin],
  props: {
    integration: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      endPoint: '',
      alertMessage: '',
      values: {},
      fileData: '',
      gptDocument: '',
      errorMessage: null,
      aiData: '',
    };
  },
  computed: {
    ...mapGetters({
      uiFlags: 'integrations/getUIFlags',
      websiteInboxes: 'inboxes/getWebsiteInboxes',
      dialogFlowEnabledInboxes: 'inboxes/dialogFlowEnabledInboxes',
    }),
    inboxes() {
      return this.dialogFlowEnabledInboxes
        .filter(inbox => {
          if (!this.isIntegrationDialogflow) {
            return true;
          }
          return !this.connectedDialogflowInboxIds.includes(inbox.id);
        })
        .map(inbox => ({ label: inbox.name, value: inbox.id }));
    },

    connectedDialogflowInboxIds() {
      if (!this.isIntegrationDialogflow) {
        return [];
      }
      if (!this.isIntegrationChatGPT) {
          return [];
      }
      return this.integration.hooks.map(hook => hook.inbox?.id);
    },
    formItems() {
      return this.integration.settings_form_schema;
    },
    isIntegrationDialogflow() {
      return this.integration.id === 'dialogflow';
    },
    isIntegrationChatGPT() {
        return this.integration.id === 'chatgpt';
    },
  },
  methods: {
    onClose() {
      this.$emit('close');
    },
    gptFile(event) {
      this.fileData = event.target.files[0];
      const fileName = this.fileData.name;
      // Validate file extension
      if (!fileName.endsWith('.jsonl')) {
        this.errorMessage = 'File must have .jsonl extension';
        return;
      }
      this.errorMessage = null;
    },
    buildHookPayload() {
      const hookPayload = {
        app_id: this.integration.id,
        settings: {},
      };

      hookPayload.settings = Object.keys(this.values).reduce((acc, key) => {
        if (key !== 'inbox') {
          acc[key] = this.values[key];
        }
        return acc;
      }, {});

      if (this.integration?.id !== 'chatgpt') {
          this.formItems.forEach(item => {
              if (item.validation.includes('JSON')) {
                  hookPayload.settings[item.name] = JSON.parse(
                      hookPayload.settings[item.name]
                  );
              }
          });
      }

      if (this.isHookTypeInbox && this.values.inbox) {
        hookPayload.inbox_id = this.values.inbox;
      }
      return hookPayload;
    },
    async submitForm() {
      try {
           if(this.errorMessage != null) {
               return;
           }

          if (this.integration.id === 'chatgpt') {
              const aiData = this.buildHookPayload();
              if (this.fileData && aiData.settings?.openai_api_key) {
                  try {
                      this.gptDocument = await this.$store.dispatch(
                          'integrations/uploadFileChatGPT',
                          {
                              file: this.fileData,
                              apiKey: aiData.settings?.openai_api_key,
                              openAIUrl: window.chatwootConfig.openAIBaseUrl
                          }
                      );
                  } catch (error) {
                      this.showAlert(error.message);
                      throw error;
                      return;
                  }
              } else {
                  this.alertMessage = this.$t('INTEGRATION_APPS.ADD.API.API_ERROR_MESSAGE');
                  this.showAlert(this.alertMessage);
                  return;
              }
          }

          if (this.integration.id === 'chatgpt') {
              const aiInfo = this.buildHookPayload();
              const payload = {
                  app_id: this.integration.id,
                  chatgpt_api_key: aiInfo.settings?.openai_api_key,
                  chatgpt_document_id: this.gptDocument?.id,
                  settings: {
                      chatgpt_api_key: aiInfo.settings?.openai_api_key,
                      chatgpt_document_id: this.gptDocument?.id
                  }
              }
              await this.$store.dispatch('integrations/createGPTHook', payload);
          }else {
              await this.$store.dispatch('integrations/createHook', this.buildHookPayload());
          }

        this.alertMessage = this.$t('INTEGRATION_APPS.ADD.API.SUCCESS_MESSAGE');
        this.onClose();
      } catch (error) {
        const errorMessage = error?.response?.data?.message;
        this.alertMessage =
          errorMessage || this.$t('INTEGRATION_APPS.ADD.API.ERROR_MESSAGE');
      } finally {
        this.showAlert(this.alertMessage);
      }
    },
  },
};
</script>
<style scoped>
.formulate-file-error {
    color: #F94B4A;
    color: var(--r-400);
    display: block;
    font-size: 1.4rem;
    font-size: var(--font-size-small);
    font-weight: 400;
    margin-bottom: 1rem;
    width: 100%;
}
</style>
