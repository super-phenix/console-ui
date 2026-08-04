import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnInit, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { CONTROLLER_PATH, WS_PROTOCOL, environment } from '@env/environment';
import { SESSION_TOKEN_URL } from '@shared/services/auth.service';
import * as RFB from '@novnc/novnc/lib/rfb';
import { Session } from '@shared/models/data/user';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-vnc',
  imports: [MatButtonModule, MatIcon],
  templateUrl: './vnc.component.html',
  styleUrl: './vnc.component.scss',
})
export class VNCComponent implements OnInit {
  private http = inject(HttpClient);

  destroyRef = inject(DestroyRef);

  orgaId!: string;
  projectId!: string;
  elem!: HTMLElement;

  vmName: string | null;
  codeAz: string | null;

  statusElement = viewChild<ElementRef<HTMLElement>>('status');
  desktopName?: string;

  rfb?: RFB.default;

  constructor() {
    const route = inject(ActivatedRoute);

    this.orgaId = route.snapshot.paramMap.get('orgId') || '';
    this.projectId = route.snapshot.paramMap.get('projectId') || '';
    this.codeAz = route.snapshot.paramMap.get('az') || '';
    this.vmName = route.snapshot.paramMap.get('productId') || '';
  }

  ngOnInit() {
    if (this.vmName) {
      this.initVNC();
    } else {
      console.log('Failed to initialize connection');
    }
  }

  async initVNC() {
    const res = await firstValueFrom(this.http.get<Session>(SESSION_TOKEN_URL, { withCredentials: true }));
    const accessToken = res.session;

    console.log(
      `${WS_PROTOCOL}${environment.apiUrl}/${this.orgaId}${CONTROLLER_PATH}/${this.codeAz}/${this.projectId}/instance/${this.vmName}/vnc`
    );

    const wsUrl = `${WS_PROTOCOL}${environment.apiUrl}/${this.orgaId}${CONTROLLER_PATH}/${this.codeAz}/${this.projectId}/instance/${this.vmName}/vnc?bearer=${accessToken}`;

    const container: HTMLSpanElement | null = document.getElementById('screen');
    if (container) {
      try {
        this.rfb = new RFB.default(container, wsUrl);
        this.rfb.viewOnly = false;
        this.rfb.scaleViewport = true;

        this.rfb.addEventListener('connect', this.connectedToServer.bind(this));
        this.rfb.addEventListener('disconnect', this.disconnectedFromServer.bind(this));
        //this.rfb.addEventListener("credentialsrequired", credentialsAreRequired);
        this.rfb.addEventListener('desktopname', this.updateDesktopName.bind(this));

        this.updateStatus('Connecting...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error creating RFB:', err);
        this.updateStatus('Error: ' + err.message);
      }
    }
  }

  refreshSession() {
    if (this.rfb) {
      console.log('disconnecting previous session');
      this.rfb.disconnect();
    }
    this.initVNC();
  }

  updateStatus(text: string) {
    if (this.statusElement()) {
      this.statusElement()!.nativeElement.textContent = text;
    }
  }

  connectedToServer() {
    this.updateStatus('Connected to ' + this.desktopName);
  }

  disconnectedFromServer(e: { detail: { clean: string } }) {
    if (e.detail.clean) {
      this.updateStatus('Disconnected cleanly');
    } else {
      this.updateStatus('Connection error');
    }
  }

  // credentialsAreRequired() {
  //   if (this.rfb) {
  //     const password = prompt('Password required:');
  //     this.rfb.sendCredentials({ password });
  //   }
  // }

  updateDesktopName(e: { detail: { name: string } }) {
    this.desktopName = e.detail.name;
  }

  sendCtrlAltDel() {
    if (this.rfb) {
      this.rfb.sendCtrlAltDel();
    }
    return false;
  }

  async paste() {
    if (!this.rfb) return;
    try {
      const text = await navigator.clipboard.readText();
      console.log('Text to paste:', text);

      for (const char of text) {
        const keysym = char.charCodeAt(0);
        this.rfb.sendKey(keysym, null);
        await new Promise(r => setTimeout(r, 10));
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      alert('Unable to read the clipboard.');
    }
  }
}
