import { c, attr, key, prop, on, cls, css, body, Val, operator } from '../../src/dom.js';

let list = [], ctr = 0; // key of the last entry
try {
  list = JSON.parse(localStorage.list);
  if (list.length) ctr = Math.max(...list.map(x => x.key)) + 1;
  // [{ title: '1', editing: false, completed: false }];
} catch {}

function save() {
  localStorage.list = JSON.stringify(list);
  body.refresh();
}

// mini-router
let filter = Val(document.location.hash.slice(2));
window.addEventListener('hashchange', () => filter(document.location.hash.slice(2)));

// list states
const isVisible = (todo) => ({ active: !todo.completed, completed: todo.completed })[filter()] ?? true;
const allCompleted = () => list.every(t => t.completed);

function completeAll() {
  let newStatus = !allCompleted();
  list.forEach(t => t.completed = newStatus);
  save();
}

let title = Val('');
function addTask(title) {
  list.push({ title, completed: false, editing: false, key: ctr++, });    
  save();
}
function doneEditing(index) {
  delete list[index].previousTitle;
  list[index].editing = false;
  if (list[index].title === '') {
    list.splice(index, 1);
  }
  save();
}
function cancelEditing(index) {
  list[index].title = list[index].previousTitle;
  delete list[index].previousTitle;
  list[index].editing = false;
  body.refresh();
}
function clearCompleted() {
  list = list.filter(t => !t.completed);
  save();
}

function enterEsc(enter, esc) {
  return on.keyup(e => {
    if (e.keyCode === 13) {
      enter();
    } else if (e.keyCode === 27) {
      esc();
    }
  });
}

const TodoList = () => list.filter(isVisible).map((task, index) => c.Li(
  cls.completed(task.completed).editing(task.editing),
  key(task.key),
  c.view(
    c.Input.toggle(
      attr.type('checkbox'),
      prop.checked(task.completed),
      on.click(() => { task.completed = !task.completed; save(); })),
    c.Label(
      on.click(async () => {
        task.editing = true;
        task.previousTitle = task.title;
        await body.refresh();
        // focus the input after DOM has been updated
        let elm = task.editing.elm; // focus...
        if (elm) { elm.select(); elm.focus(); }
      }),
      task.title),
    c.Button.destroy(on.click(() => { list.splice(index, 1); save(); }))),
  c.Input.edit(
    operator((parent) => { if (task.editing) task.editing = parent; }), // ...pocus
    prop.value(task.title),
    enterEsc(() => doneEditing(index), () => cancelEditing(index)),
    on.input(e => { task.title = e.target.value; body.refresh(); })
      .blur(e => doneEditing(index)))
));

let completed, active;
const Footer = c.Footer.footer(
  c.Span.todoCount(
    c.Strong(() => (active = list.length - (completed = list.filter(t => t.completed).length))),
    () => ' item' + (active !== 1 ? 's' : '') + ' left'),
  c.Ul.filters(
    c.Li(c.A(attr.href('#/'), cls.selected(() => filter() === ''), 'All')),
    c.Li(c.A(attr.href('#/active'), cls.selected(() => filter() === 'active'), 'Active')),
    c.Li(c.A(attr.href('#/completed'), cls.selected(() => filter() === 'completed'), 'Completed'))),
  () => !!completed && c.Button.clearCompleted(on.click(clearCompleted), 'Clear completed'));

const App = [
  c.Header.header(
    c.H1('todos'),
    c.Input.newTodo(
      attr.placeholder('What needs to be done?').autofocus(true),
      prop.value(title),
      enterEsc(() => {
        addTask(title().trim());
        title('');
      }, () => title('')),
      on.input(e => title(e.target.value)),
    )),
  c.Section.main(
    css.display(() => list.length ? '' : 'none'),
    c.Input.toggleAll(
      attr.id('toggle-all').type('checkbox'),
      prop.checked(allCompleted),
      on.click(completeAll)),
    c.Label(attr.for('toggle-all')),
    c.Ul.todoList(TodoList),
  ),
  () => list.length ? Footer : '',
];

body(
  c.Section.todoapp(App),
  c.Footer.info(
    c.P('Double-click to edit a todo'),
    c.P('Frameorc demo'),
    c.P('Based on ', c.A(attr.href("http://todomvc.com"), 'TodoMVC'))));

