import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CONTROLLER_PATH, WS_PROTOCOL, environment } from '@env/environment';
import { SESSION_TOKEN_URL } from '@shared/services/auth.service';
import { Session } from '@shared/models/data/user';
import { AttachAddon } from '@xterm/addon-attach';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'spx-terminal',
  imports: [],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.scss',
})
export class TerminalComponent implements OnInit {
  private http = inject(HttpClient);

  destroyRef = inject(DestroyRef);

  orgaId!: string;
  projectId!: string;
  term = new Terminal();
  fitAddon = new FitAddon();
  elem!: HTMLElement;

  vmName: string | null;
  codeAz: string | null;

  constructor() {
    const route = inject(ActivatedRoute);

    this.orgaId = route.snapshot.paramMap.get('orgId') || '';
    this.projectId = route.snapshot.paramMap.get('projectId') || '';
    this.codeAz = route.snapshot.paramMap.get('az') || '';
    this.vmName = route.snapshot.paramMap.get('productId') || '';
    this.term.loadAddon(this.fitAddon);
  }

  ngOnInit() {
    if (this.vmName) {
      this.initTerm();
    } else {
      console.log('Failed to initialize connection');
    }
  }

  async initTerm() {
    const terminal = new Terminal();
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(document.getElementById('terminal')!);
    fitAddon.fit();

    const res = await firstValueFrom(this.http.get<Session>(SESSION_TOKEN_URL, { withCredentials: true }));
    const accessToken = res.session;

    console.log(
      `${WS_PROTOCOL}${environment.apiUrl}/${this.orgaId}${CONTROLLER_PATH}/${this.codeAz}/${this.projectId}/instance/${this.vmName}/serial`
    );

    const webSocket = new WebSocket(
      `${WS_PROTOCOL}${environment.apiUrl}/${this.orgaId}${CONTROLLER_PATH}/${this.codeAz}/${this.projectId}/instance/${this.vmName}/serial?bearer=` +
        accessToken
    );

    const sendSize = () => {
      const windowSize = { high: terminal.rows, width: terminal.cols };
      const blob = new Blob([JSON.stringify(windowSize)], {
        type: 'application/json',
      });
      webSocket.send(blob);
    };

    webSocket.onopen = sendSize;

    const resizeScreen = () => {
      fitAddon.fit();
      sendSize();
    };
    window.addEventListener('resize', resizeScreen, false);

    const attachAddon = new AttachAddon(webSocket);
    terminal.loadAddon(attachAddon);

    setTimeout(() => window.resizeBy(1, 1), 200);
  }
}
