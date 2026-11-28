import { Injectable, signal } from '@angular/core';
import { UiNodeScriptAttributes } from '@ory/client';

@Injectable({
  providedIn: 'root',
})
export class WebauthnScriptService {
  readonly state = signal<'loading' | 'ready' | 'failed'>('loading');

  /**
   * Angular strips scripts from templates, so the one Kratos sends for WebAuthn is added by hand.
   * It stays loaded across flows and only registers global functions.
   */
  load(attributes: UiNodeScriptAttributes) {
    if (document.getElementById(attributes.id)) {
      return;
    }
    this.state.set('loading');
    const script = document.createElement('script');
    script.id = attributes.id;
    script.src = attributes.src;
    script.type = attributes.type;
    script.async = attributes.async;
    script.crossOrigin = attributes.crossorigin;
    script.integrity = attributes.integrity;
    script.referrerPolicy = attributes.referrerpolicy;
    script.nonce = attributes.nonce;
    script.onload = () => this.state.set('ready');
    script.onerror = () => {
      // A failed element left in the page would block the next attempt.
      script.remove();
      this.state.set('failed');
    };
    document.body.appendChild(script);
  }
}
