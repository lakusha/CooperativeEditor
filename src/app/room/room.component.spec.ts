import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { RoomComponent } from './room.component';
import { RouterService, BEService } from '../shared';

import { Observable, BehaviorSubject, Subject } from 'rxjs/Rx';

describe('RoomComponent', () => {
  let component: RoomComponent;
  let fixture: ComponentFixture<RoomComponent>;

  let routerServiceMock, routerService,
      beServiceMock, beService;

  beforeEach(async(() => {
    routerServiceMock = {
      navigateToLogin: () => {}
    };

    beServiceMock = {
      fileSave: () => {},
      getEditorValue: () => {},
      updateFile: () => {},
      logOut: () => {},
      runScript: () => {},
      sendMessage: () => {},
      getChatMessages: () => {},
      user$: new BehaviorSubject({nickname: '', roomName: ''}),
      file$: new BehaviorSubject(''),
      output$: new BehaviorSubject(''),
      outputError$: new BehaviorSubject(''),
      chatMessages$: new BehaviorSubject({from: '', content: ''}),
      changeUserSubject: function (param) {
        this.user$.next(param);
      },
      changeFileSubject: function (param) {
        this.file$.next(param);
      },
      changeOutputSubject: function (param) {
        this.output$.next(param);
      },
      changeOutputErrorSubject: function (param) {
        this.outputError$.next(param);
      },
      changeChatMessagesSubject: function (param) {
        this.chatMessages$.next(param);
      }
    };

    TestBed.configureTestingModule({
      declarations: [ RoomComponent ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        {provide: RouterService, useValue: routerServiceMock },
        {provide: BEService, useValue: beServiceMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoomComponent);
    component = fixture.componentInstance;
    component.editor.getEditor = () => {
      return {
        $blockScrolling: Infinity,
        commands: {
          addCommand: (a) => { a.exec(); }
        },
        setOption: () => {},
        getValue: () => 'editorValue',
        setValue: (newValue, params) => { return {newValue, params}; }
      };
    };
    component.output.getEditor = () => {
      return {
        $blockScrolling: Infinity,
        setOption: () => {},
        getValue: () => 'outputValue',
        setValue: (newValue, params) => { return {newValue, params}; }
      };
    };
    component.messagesContainer = {
      nativeElement: {
        scrollHeight: 100
      }
    };
    routerService = fixture.debugElement.injector.get(RouterService);
    beService = fixture.debugElement.injector.get(BEService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('~initialization', () => {
    expect(component.userNickname).toEqual('');
    expect(component.userRoom).toEqual('');
  });

  describe('#ngOnInit', () => {

    beforeEach(() => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      const routerServiceObj = spyOn(component, 'routerService').and.callThrough();
      spyOn(component.editor.getEditor(), 'getValue');
      spyOn(component.editor.getEditor(), 'setValue');
      spyOn(routerServiceObj, 'navigateToLogin');
      spyOn(beServiceObj, 'fileSave');

      beService.changeUserSubject({nickname: 'someNick', roomName: 'someRoom'});
      beService.changeFileSubject('someText');
      beService.changeChatMessagesSubject({from: 'user', content: 'hello'});
      jasmine.clock().install();
      fixture.detectChanges();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should be defined', () => {
      expect(component.ngOnInit).toBeDefined();
    });

    it('should navigate to login page if no user', () => {
      beService.changeUserSubject({nickname: '', roomName: 'someRoom'});
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.routerService.navigateToLogin).toHaveBeenCalledWith();
    });

    it('should set userNickname & userRoom when new data comes from user$ observable', () => {
      component.ngOnInit();
      expect(component.userNickname).toEqual('someNick');
      expect(component.userRoom).toEqual('someRoom');
    });

    it('should set text value when new data comes from file$ observable', () => {
      component.ngOnInit();
      expect(component.editor.getEditor().setValue('newValue', 1)).toEqual({newValue: 'newValue', params: 1});
    });

    it('should set text value when new data comes from output$ observable', () => {
      component.ngOnInit();
      expect(component.output.getEditor().setValue('newValue', 1)).toEqual({newValue: 'newValue', params: 1});
    });

    it('should set text value when new data comes from outputError$ observable', () => {
      component.ngOnInit();
      expect(component.output.getEditor().setValue('newError', -1)).toEqual({newValue: 'newError', params: -1});
    });

    it('should push message to chatMessages array', () => {
      component.ngOnInit();
      expect(component.chatMessages).toEqual([{from: 'user', content: 'hello'}, {from: 'user', content: 'hello'}]);
    });

    it('should scroll down when new messages comes', () => {
      component.ngOnInit();
      jasmine.clock().tick(0);
      expect(component.messagesContainer.nativeElement.scrollTop).toEqual(100);
    });

    it('should set text value when new data comes from file$ observable', () => {
      spyOn(component, 'saveFile');
      component.ngOnInit();
      jasmine.clock().tick(5001);
      expect(component.saveFile).toHaveBeenCalledWith();
    });

    it('should init custom commands', () => {
      const initCustomCommands = spyOn(component, 'initCustomCommands').and.callThrough();
      component.ngOnInit();
      expect(initCustomCommands).toHaveBeenCalledWith();
    });

    it('should set $blockScrolling to Infinity to block console pollution from library', () => {
      component.ngOnInit();
      expect(component.editor.getEditor().$blockScrolling).toEqual(Infinity);
      expect(component.output.getEditor().$blockScrolling).toEqual(Infinity);
    });

  });

  describe('#sendMessage', () => {

    it('should be defined', () => {
      expect(component.sendMessage).toBeDefined();
    });

    it('should call beService sendMessage method with message, nick, room', () => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      spyOn(beServiceObj, 'sendMessage');
      beService.changeUserSubject({nickname: 'someNick', roomName: 'someRoom'});
      fixture.detectChanges();
      component.sendMessage('hello');
      expect(component.beService.sendMessage).toHaveBeenCalledWith('hello', 'someNick', 'someRoom');
    });

  });

  describe('#initCustomCommands', () => {

    let initCustomCommands;

    beforeEach(() => {
      spyOn(component, 'saveFile');
      spyOn(component, 'runScript');
      initCustomCommands = spyOn(component, 'initCustomCommands').and.callThrough();
    });

    it('should be defined', () => {
      expect(initCustomCommands).toBeDefined();
    });

    it('should set output value to "" if no editor value', () => {
      component.editor.getEditor = () => {
        return {
          $blockScrolling: Infinity,
          commands: {
            addCommand: (a) => { a.exec(); }
          },
          setOption: () => {},
          getValue: () => '',
          setValue: (newValue, params) => { return {newValue, params}; }
        };
      };
      expect(component.output.getEditor().setValue('')).toEqual({newValue: '', params: undefined});
      fixture.detectChanges();
      component.ngOnInit();
      expect(component.saveFile).toHaveBeenCalledWith();
      expect(component.runScript).toHaveBeenCalledWith();
    });

    it('should add ctrl+s combination', () => {
      component.ngOnInit();
      expect(component.saveFile).toHaveBeenCalledWith();
      expect(component.runScript).toHaveBeenCalledWith();
    });

  });

  describe('#runScript', () => {

    beforeEach(() => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      spyOn(beServiceObj, 'runScript');
      beService.changeUserSubject({nickname: 'someNick', roomName: 'someRoom'});
      fixture.detectChanges();
    });

    it('should be defined', () => {
      expect(component.runScript).toBeDefined();
    });

    it('should call beService runScript method', () => {
      component.runScript();
      expect(component.beService.runScript).toHaveBeenCalledWith('editorValue'.split('\n').join(''), 'someRoom');
    });

  });

  describe('#onEditorChanges', () => {

    beforeEach(() => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      spyOn(beServiceObj, 'updateFile');
      beService.changeUserSubject({nickname: 'someNick', roomName: 'someRoom'});
      fixture.detectChanges();
    });

    it('should be defined', () => {
      expect(component.onEditorChanges).toBeDefined();
    });

    it('should call beService updateFile with editor value & roomName', () => {
      component.onEditorChanges();
      expect(component.beService.updateFile).toHaveBeenCalledWith('editorValue', 'someRoom');
    });

  });

  describe('#ngOnDestroy', () => {

    beforeEach(() => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      spyOn(beServiceObj, 'logOut');
      spyOn(window, 'clearInterval');
    });

    it('should be defined', () => {
      expect(component.ngOnDestroy).toBeDefined();
    });

    it('should call beService updateFile with editor value & roomName', () => {
      component.ngOnDestroy();
      expect(component.beService.logOut).toHaveBeenCalledWith();
    });

    it('should call beService updateFile with editor value & roomName', () => {
      component.ngOnDestroy();
      expect(window.clearInterval).toHaveBeenCalledWith(component.saver);
    });

  });

  describe('#saveFile', () => {

    beforeEach(() => {
      const beServiceObj = spyOn(component, 'beService').and.callThrough();
      spyOn(beServiceObj, 'fileSave');
      beService.changeUserSubject({nickname: 'someNick', roomName: 'someRoom'});
      fixture.detectChanges();
    });

    it('should be defined', () => {
      expect(component.saveFile).toBeDefined();
    });

    it('should call beService updateFile with editor value & roomName', () => {
      component.saveFile();
      expect(component.beService.fileSave).toHaveBeenCalledWith('editorValue', 'someRoom');
    });

  });
});
