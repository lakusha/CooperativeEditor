import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';

import { RouterService, BEService } from '../shared';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editor') editor;
  @ViewChild('output') output;
  userNickname: string;
  userRoom: string;
  saver: any;

  constructor(
    public routerService: RouterService,
    public beService: BEService
  ) {
    this.userNickname = '';
    this.userRoom = '';
  }

  ngOnInit() {
    this.beService.user$.subscribe(data => {
      if (!data.nick) {
        this.routerService.navigateToLogin();
      }
      this.userNickname = data.nick;
      this.userRoom = data.room;
    });

    this.beService.file$.subscribe(file => {
      this.editor.getEditor().setValue(file, 1);
    });

    this.beService.output$.subscribe(output => {
      this.output.getEditor().setValue(output, 1);
    });

    this.beService.outputError$.subscribe(outputError => {
      this.output.getEditor().setValue(outputError, -1);
    });

    this.saver = setInterval(() => {
      this.saveFile();
    }, 5000);

    this.beService.getEditorValue(this.userRoom);
  }

  ngAfterViewInit() {
    this.initCustomCommands();
    // Just preventing some console pollution from editor library
    this.editor.getEditor().$blockScrolling = Infinity;
    this.output.getEditor().$blockScrolling = Infinity;
  }

  sendMessage(msg) {
    console.log(msg);
  }

  initCustomCommands() {
    this.editor.getEditor().commands.addCommand({
      name: 'runAndSave',
      bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
      exec: () => {
        if (this.editor.getEditor().getValue() === '') {
          this.output.getEditor().setValue('');
        }
        this.saveFile();
        this.runScript();
      },
      readOnly: true
    });
  }

  runScript() {
    this.beService.runScript(this.editor.getEditor().getValue(), this.userRoom);
  }

  onEditorChanges() {
    this.beService.updateFile(this.editor.getEditor().getValue(), this.userRoom);
  }

  ngOnDestroy() {
    this.beService.leaveRoom();
    clearInterval(this.saver);
  }

  saveFile() {
    this.beService.fileSave(this.editor.getEditor().getValue(), this.userRoom);
    console.log('File saved');
  }

}
