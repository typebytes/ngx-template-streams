import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { render } from '@testing-library/angular';
import { noop, Observable } from 'rxjs';
import { ObservableChild } from './observable-child';

describe('@ObservableChild', () => {
  describe('when query options are passed', () => {
    // TODO
  });

  describe('when event listener options are passed', () => {
    // TODO
  });

  describe('when using template reference variables', () => {
    it('should query element and store element reference on target', async () => {
      @Component({
        template: `
          <button #button>Test</button>
        `
      })
      class TestComponent {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;
      }

      const { fixture } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance['__buttonClick$'] instanceof ElementRef).toBe(true);
    });

    it('should create event stream', async () => {
      @Component({
        template: `
          <button data-testid="button" #button>Test</button>
        `
      })
      class TestComponent {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;
      }

      const { fixture, getByTestId, click } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.buttonClick$ instanceof Observable).toBe(true);

      const nextSpy = jest.fn();

      componentInstance.buttonClick$.subscribe(nextSpy, noop, noop);
      click(getByTestId('button'));
      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe('when using components', () => {
    it('should query component and store instance on target', async () => {
      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent {
        @ObservableChild(FooComponent, 'testEvent')
        testEvent$: Observable<any>;
      }

      const { fixture } = await render(TestComponent, {
        declarations: [FooComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance['__testEvent$'] instanceof FooComponent).toBe(true);
    });

    it('should create event stream', async () => {
      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent {
        @ObservableChild(FooComponent, 'testEvent')
        testEvent$: Observable<any>;
      }

      const { fixture, getByTestId, click } = await render(TestComponent, {
        declarations: [FooComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.testEvent$ instanceof Observable).toBe(true);

      const nextSpy = jest.fn();

      componentInstance.testEvent$.subscribe(nextSpy, noop, noop);

      click(getByTestId('foo-button'));

      expect(nextSpy).toHaveBeenCalled();
    });

    it('should throw error if output does not exist', async () => {
      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent {
        @ObservableChild(FooComponent, 'nonsense')
        testEvent$: Observable<any>;
      }

      await expect(
        render(TestComponent, {
          declarations: [FooComponent]
        })
      ).rejects.toThrowError(
        `[ObservableChild] Cannot create event stream for 'nonsense' on target 'FooComponent'. Event does not exist.`
      );
    });
  });

  describe('when query result is undefined', () => {
    it('should not throw error and return undefined', async () => {
      @Component({
        template: ''
      })
      class TestComponent {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;
      }

      const renderResult = render(TestComponent);
      expect(renderResult).resolves.toBeDefined();

      const { fixture } = await renderResult;
      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.buttonClick$).toBeUndefined();
      expect(componentInstance['__buttonClick$']).toBeUndefined();
    });
  });

  describe('when element is destroyed and re-created', () => {
    it('should re-create event stream', async () => {
      @Component({
        template: `
          <div *ngIf="showElement" data-testid="div" #div>Some Content</div>
          <button data-testid="toggle" (click)="showElement = !showElement">Test</button>
        `
      })
      class TestComponent {
        showElement = true;

        @ObservableChild('div', 'click')
        clicks$: Observable<any>;
      }

      const { fixture, getByTestId, click, queryByTestId } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.clicks$).toBeDefined();

      const nextSpy = jest.fn();
      const completeSpy = jest.fn();
      componentInstance.clicks$.subscribe(nextSpy, noop, completeSpy);

      click(getByTestId('div'));
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // hide element
      click(getByTestId('toggle'));
      expect(componentInstance['__clicks$']).not.toBeDefined();
      expect(queryByTestId('div')).toBeNull();
      expect(completeSpy).not.toHaveBeenCalled();

      // show element again
      click(getByTestId('toggle'));
      expect(queryByTestId('div')).toBeDefined();
      expect(componentInstance['__clicks$']).toBeDefined();

      click(getByTestId('div'));
      expect(nextSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('when creating multiple instances', () => {
    it('should create independent event streams', async () => {
      @Component({
        template: `
          <bar #bar1></bar>
          <bar #bar2></bar>
        `
      })
      class TestComponent {
        @ViewChild('bar1', { static: false })
        bar1: BarComponent;

        @ViewChild('bar2', { static: false })
        bar2: BarComponent;
      }

      const { fixture } = await render(TestComponent, {
        declarations: [BarComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.bar1.buttonClick$).not.toBe(componentInstance.bar2.buttonClick$);
    });
  });

  describe('when destroyed', () => {
    it('should complete event stream', async () => {
      @Component({
        template: `
          <button data-testid="button" #button>Test</button>
        `
      })
      class TestComponent {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;
      }

      const { fixture } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      const completeSpy = jest.fn();

      componentInstance.buttonClick$.subscribe(noop, noop, completeSpy);

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should not emit after completion', async () => {
      @Component({
        template: `
          <button data-testid="button" #button>Test</button>
        `
      })
      class TestComponent implements OnDestroy {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;

        ngOnDestroy() {}
      }

      const { fixture, getByTestId, click } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      const nextSpy = jest.fn();

      componentInstance.buttonClick$.subscribe(nextSpy, noop, noop);

      // simulate ngOnDestroy by calling it manually
      componentInstance.ngOnDestroy();

      click(getByTestId('button'));
      expect(nextSpy).not.toHaveBeenCalled();
    });

    it('should call original ngOnDestroy', async () => {
      @Component({
        template: `
          <button data-testid="button" #button>Test</button>
        `
      })
      class TestComponent implements OnDestroy {
        @ObservableChild('button', 'click')
        buttonClick$: Observable<any>;

        ngOnDestroy() {
          console.log('original ngOnDestroy');
        }
      }

      const { fixture } = await render(TestComponent);

      const onDestroySpy = jest.spyOn(console, 'log').mockImplementation();

      fixture.destroy();

      expect(onDestroySpy).toHaveBeenCalledWith('original ngOnDestroy');
    });
  });
});

@Component({
  selector: 'foo',
  template: `
    <button data-testid="foo-button" (click)="testEvent.emit('payload')">Click Me</button>
  `
})
class FooComponent {
  @Output() testEvent = new EventEmitter();
}

@Component({
  selector: 'bar',
  template: `
    <button data-testid="bar-button" #button>Click Me</button>
  `
})
class BarComponent {
  @ObservableChild('button', 'click')
  buttonClick$: Observable<any>;
}
