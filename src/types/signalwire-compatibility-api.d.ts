/**
 * Ambient type declaration for @signalwire/compatibility-api.
 *
 * The package ships full .d.ts files, but its package.json `exports` map has
 * no `types` condition, so TypeScript's `bundler` moduleResolution can't find
 * them. Aliasing via tsconfig `paths` would also redirect Next's runtime
 * bundler to the .d.ts and break the build, so instead we declare exactly the
 * surface signalwire.ts uses. Runtime resolution is untouched.
 */
declare module "@signalwire/compatibility-api" {
  interface AvailableNumber {
    phoneNumber: string;
    friendlyName: string;
    locality: string;
    region: string;
    capabilities: unknown;
  }

  interface IncomingPhoneNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
  }

  interface SayAttributes {
    voice?: string;
  }

  interface GatherAttributes {
    input?: string[];
    action?: string;
    method?: string;
    speechTimeout?: string;
  }

  interface GatherNode {
    say(attributes: SayAttributes, text: string): void;
  }

  class VoiceResponse {
    gather(attributes?: GatherAttributes): GatherNode;
    say(attributes: SayAttributes, text: string): void;
    say(text: string): void;
    hangup(): void;
    toString(): string;
  }

  interface IncomingPhoneNumberUpdateOpts {
    voiceUrl?: string;
    voiceMethod?: string;
    statusCallback?: string;
    statusCallbackMethod?: string;
  }

  interface IncomingPhoneNumberResource {
    update(opts: IncomingPhoneNumberUpdateOpts): Promise<IncomingPhoneNumber>;
  }

  interface IncomingPhoneNumbers {
    (sid: string): IncomingPhoneNumberResource;
    list(opts: {
      phoneNumber?: string;
      limit?: number;
    }): Promise<IncomingPhoneNumber[]>;
    create(opts: {
      phoneNumber?: string;
      areaCode?: string;
      voiceUrl?: string;
      voiceMethod?: string;
      statusCallback?: string;
      statusCallbackMethod?: string;
    }): Promise<IncomingPhoneNumber>;
  }

  interface CallInstance {
    sid: string;
  }

  interface CallCreateOpts {
    to: string;
    from: string;
    url: string;
    method?: string;
    statusCallback?: string;
    statusCallbackMethod?: string;
    statusCallbackEvent?: string[];
  }

  interface Calls {
    create(opts: CallCreateOpts): Promise<CallInstance>;
  }

  interface MessageInstance {
    sid: string;
  }

  interface MessageCreateOpts {
    to: string;
    from: string;
    body: string;
  }

  interface Messages {
    create(opts: MessageCreateOpts): Promise<MessageInstance>;
  }

  interface RestClientInstance {
    availablePhoneNumbers(country: string): {
      local: {
        list(opts: {
          areaCode?: number;
          limit?: number;
        }): Promise<AvailableNumber[]>;
      };
    };
    incomingPhoneNumbers: IncomingPhoneNumbers;
    calls: Calls;
    messages: Messages;
  }

  interface RestClientOptions {
    signalwireSpaceUrl?: string;
  }

  interface RestClientConstructor {
    new (
      username: string,
      token: string,
      opts?: RestClientOptions,
    ): RestClientInstance;
    (
      username: string,
      token: string,
      opts?: RestClientOptions,
    ): RestClientInstance;
    LaML: { VoiceResponse: { new (): VoiceResponse } };
  }

  export const RestClient: RestClientConstructor;
  export type { RestClientInstance };
}
