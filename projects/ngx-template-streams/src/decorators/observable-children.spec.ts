import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  QueryList,
  ViewChild
} from '@angular/core';

import { async } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { noop, Observable } from 'rxjs';
import { ObservableChildren } from './observable-children';

describe.only('@ObservableChildren', () => {
  describe('when using template reference variables', () => {
    it('should query elements and store query list', async () => {
      @Component({
        template: `
          <ul>
            <li #item>Item 1</li>
            <li #item>Item 2</li>
            <li #item>Item 3</li>
          </ul>
        `
      })
      class TestComponent {
        @ObservableChildren('item', 'click')
        clicks$: Observable<any>;
      }

      const { fixture } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;
      const queryList = componentInstance['__clicks$'] as QueryList<ElementRef>;

      expect(componentInstance['__clicks$'] instanceof QueryList).toBe(true);
      expect(queryList.length).toBe(3);
      expect(queryList.first instanceof ElementRef).toBe(true);
    });

    it('should query elements and create single event stream for all elements', async () => {
      @Component({
        template: `
          <ul>
            <li data-testid="item-1" #item>Item 1</li>
            <li data-testid="item-2" #item>Item 2</li>
            <li data-testid="item-3" #item>Item 3</li>
          </ul>
        `
      })
      class TestComponent {
        @ObservableChildren('item', 'click')
        clicks$: Observable<any>;
      }

      const { fixture, click, getByTestId } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      const nextSpy = jest.fn();
      componentInstance.clicks$.subscribe(nextSpy, noop, noop);

      click(getByTestId('item-1'));
      expect(nextSpy).toHaveBeenCalledTimes(1);

      click(getByTestId('item-2'));
      expect(nextSpy).toHaveBeenCalledTimes(2);

      click(getByTestId('item-3'));
      expect(nextSpy).toHaveBeenCalledTimes(3);
    });

    it('should listen for view changes and update the stream', async () => {
      @Component({
        template: `
          <ul>
            <li #li attr.data-testid="item-{{ text }}" *ngFor="let text of items">Item {{ text }}</li>
          </ul>
          <button data-testid="add" (click)="add()">Add</button>
          <button data-testid="remove" (click)="remove()">Remove</button>
        `
      })
      class TestComponent {
        @ObservableChildren('li', 'click')
        clicks$: Observable<any>;

        items = [1, 2, 3];

        add() {
          this.items.push(this.items.length + 1);
        }

        remove() {
          this.items.pop();
        }
      }

      const { fixture, click, getByTestId, queryByTestId } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;
      const queryList = componentInstance['__clicks$'] as QueryList<ElementRef>;

      const nextSpy = jest.fn();
      componentInstance.clicks$.subscribe(nextSpy, noop, noop);

      expect(queryList.length).toBe(3);

      // add element
      click(getByTestId('add'));
      expect(queryList.length).toBe(4);
      click(getByTestId('item-4'));
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // add one more element
      click(getByTestId('add'));
      expect(queryList.length).toBe(5);
      click(getByTestId('item-5'));
      expect(nextSpy).toHaveBeenCalledTimes(2);

      // remove element
      click(getByTestId('remove'));
      expect(queryList.length).toBe(4);
      expect(queryByTestId('item-5')).toBeNull();

      // remove one more element
      click(getByTestId('remove'));
      expect(queryList.length).toBe(3);
      expect(queryByTestId('item-4')).toBeNull();
    });

    it('should call original ngAfterViewInit', async () => {
      const afterViewInitSpy = jest.fn();

      @Component({
        template: `
          <ul>
            <li #item>Item 1</li>
            <li #item>Item 2</li>
            <li #item>Item 3</li>
          </ul>
        `
      })
      class TestComponent implements AfterViewInit {
        @ObservableChildren('item', 'click')
        clicks$: Observable<any>;

        ngAfterViewInit = afterViewInitSpy;
      }

      await render(TestComponent);

      expect(afterViewInitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when using components', () => {
    it('should query component and store instance on target', async () => {
      @Component({
        template: `
          <foo></foo>
          <foo></foo>
        `
      })
      class TestComponent {
        @ObservableChildren(FooComponent, 'testEvent')
        testEvent$: Observable<any>;
      }

      const { fixture } = await render(TestComponent, {
        declarations: [FooComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;
      const queryList = componentInstance['__testEvent$'] as QueryList<FooComponent>;

      expect(queryList instanceof QueryList).toBe(true);
      expect(queryList.length).toBe(2);
      expect(queryList.first instanceof FooComponent).toBe(true);
    });

    it('should create event stream', async () => {
      @Component({
        template: `
          <foo></foo>
          <foo></foo>
        `
      })
      class TestComponent {
        @ObservableChildren(FooComponent, 'testEvent')
        testEvent$: Observable<any>;
      }

      const { fixture, click, getAllByTestId } = await render(TestComponent, {
        declarations: [FooComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;

      expect(componentInstance.testEvent$ instanceof Observable).toBe(true);

      const nextSpy = jest.fn();
      componentInstance.testEvent$.subscribe(nextSpy, noop, noop);

      click(getAllByTestId('foo-button')[0]);
      expect(nextSpy).toHaveBeenCalledTimes(1);

      click(getAllByTestId('foo-button')[1]);
      expect(nextSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw error if output does not exist', async(async () => {
      const errorSpy = jest.fn(error => {
        expect(error.message).toMatch(
          `[ObservableChildren] Cannot create event stream for 'nonsense' on target 'FooComponent'. Event does not exist.`
        );
      });

      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent implements AfterViewInit {
        @ObservableChildren(FooComponent, 'nonsense')
        testEvent$: Observable<any>;

        ngAfterViewInit() {
          this.testEvent$.subscribe(noop, errorSpy, noop);
        }
      }

      await render(TestComponent, {
        declarations: [FooComponent]
      });
    }));

    it('should call original ngAfterViewInit', async () => {
      const afterViewInitSpy = jest.fn();

      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent implements AfterViewInit {
        @ObservableChildren(FooComponent, 'nonsense')
        testEvent$: Observable<any>;

        ngAfterViewInit = afterViewInitSpy;
      }

      await render(TestComponent, {
        declarations: [FooComponent]
      });

      expect(afterViewInitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('when query result is undefined', () => {
    it('should not throw error and return empty query list', async(async () => {
      const errorSpy = jest.fn();

      @Component({
        template: ''
      })
      class TestComponent implements AfterViewInit {
        @ObservableChildren('button', 'click')
        buttonClick$: Observable<any>;

        ngAfterViewInit() {
          this.buttonClick$.subscribe(noop, errorSpy, noop);
        }
      }

      const renderResult = render(TestComponent);
      expect(renderResult).resolves.toBeDefined();

      const { fixture } = await renderResult;
      const componentInstance = fixture.componentInstance as TestComponent;
      const queryList = componentInstance['__buttonClick$'];

      expect(queryList.length).toBe(0);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(componentInstance.buttonClick$).toBeDefined();
    }));
  });

  describe('when element is destroyed and re-created', () => {
    it('should re-create event stream', async () => {
      @Component({
        template: `
          <div *ngIf="showElement" data-testid="div" #div>Some Content</div>
          <button data-testid="toggle" (click)="showElement = !showElement">Toggle</button>
        `
      })
      class TestComponent {
        showElement = true;

        @ObservableChildren('div', 'click')
        clicks$: Observable<any>;
      }

      const { fixture, getByTestId, click, queryByTestId } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;
      const queryList = componentInstance['__clicks$'] as QueryList<ElementRef>;

      const nextSpy = jest.fn();
      const completeSpy = jest.fn();
      componentInstance.clicks$.subscribe(nextSpy, noop, completeSpy);

      click(getByTestId('div'));
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // hide element
      click(getByTestId('toggle'));
      expect(queryList.length).toBe(0);
      expect(queryByTestId('div')).toBeNull();
      expect(completeSpy).not.toHaveBeenCalled();

      // show element again
      click(getByTestId('toggle'));
      expect(queryList.length).toBe(1);
      expect(queryByTestId('div')).not.toBeNull();
      click(getByTestId('div'));
      expect(nextSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('when child component is destroyed and re-created', () => {
    it('should re-create event stream', async () => {
      @Component({
        template: `
          <bar *ngIf="showComponent">Test</bar>
          <button data-testid="toggle" (click)="showComponent = !showComponent">Toggle</button>
        `
      })
      class TestComponent {
        showComponent = true;

        @ViewChild(BarComponent, { static: false })
        bar: BarComponent;
      }

      const { fixture, getByTestId, click, queryByTestId } = await render(TestComponent, {
        declarations: [BarComponent]
      });

      const componentInstance = fixture.componentInstance as TestComponent;

      const nextSpy = jest.fn();
      const completeSpy = jest.fn();
      componentInstance.bar.buttonClick$.subscribe(nextSpy, noop, completeSpy);

      click(getByTestId('bar-item-1'));
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // hide component
      click(getByTestId('toggle'));

      expect(completeSpy).toHaveBeenCalledTimes(1);
      expect(componentInstance.bar).toBeUndefined();

      // show component
      click(getByTestId('toggle'));

      componentInstance.bar.buttonClick$.subscribe(nextSpy, noop, completeSpy);

      click(getByTestId('bar-item-3'));
      expect(nextSpy).toHaveBeenCalledTimes(2);
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
        @ObservableChildren('button', 'click')
        buttonClick$: Observable<any>;
      }

      const { fixture } = await render(TestComponent);
      const componentInstance = fixture.componentInstance as TestComponent;

      const completeSpy = jest.fn();

      componentInstance.buttonClick$.subscribe(noop, noop, completeSpy);

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should call original ngOnDestroy', async () => {
      const onDestroySpy = jest.fn();

      @Component({
        template: `
          <foo></foo>
        `
      })
      class TestComponent implements OnDestroy {
        @ObservableChildren(FooComponent, 'nonsense')
        testEvent$: Observable<any>;

        ngOnDestroy() {
          console.log('original ngOnDestroy');
        }
      }

      const { fixture } = await render(TestComponent, {
        declarations: [FooComponent]
      });

      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      fixture.destroy();

      expect(logSpy).toHaveBeenCalledWith('original ngOnDestroy');
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
    <ul>
      <li data-testid="bar-item-1" #item>Item 1</li>
      <li data-testid="bar-item-2" #item>Item 2</li>
      <li data-testid="bar-item-3" #item>Item 3</li>
    </ul>
  `
})
class BarComponent {
  @ObservableChildren('item', 'click')
  buttonClick$: Observable<any>;
}
