<script setup lang="ts">
import { computed, ref, onMounted, reactive, onUpdated } from "vue";
import { LoremIpsum } from "lorem-ipsum";
import seedrandom from "seedrandom";
import { nanoid } from "nanoid";

const menuTabs = ["Notifications", "Todo"];
const selectedTab = ref(menuTabs[1]);

const tabInfos = computed(() =>
  menuTabs.map((tab) => ({
    tab,
    isSelected: tab === selectedTab.value,
  })),
);

const lorem = new LoremIpsum({
  random: seedrandom("1234"),
  wordsPerSentence: {
    min: 5,
    max: 80,
  },
});

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const todos = reactive(
  Array.from({ length: 5 }, () => ({
    id: nanoid(),
    title: capitalize(lorem.generateWords(3)),
    description: lorem.generateSentences(1),
    pElem: null as HTMLElement | null,
    expandable: null as boolean | null,
  })),
);
const doneTodos = ref(new Set<string>());
const expandedTodoId = ref("");

const extendedTodos = computed(() =>
  todos.map((todo) => {
    return {
      data: todo,
      isDone: doneTodos.value.has(todo.id),
      selected: expandedTodoId.value === todo.id,
    };
  }),
);

function isOverflowing(elem: HTMLElement): boolean {
  return elem.scrollHeight - elem.clientHeight > 1;
}

function updateTodosExpandability() {
  extendedTodos.value.forEach((todo) => {
    const pElem = todo.data.pElem;

    if (!pElem) {
      throw new Error("p element ref is undefined!");
    }

    if (todo.data.expandable === null) {
      todo.data.expandable = isOverflowing(pElem);
    }
  });
}

onMounted(updateTodosExpandability);
onUpdated(updateTodosExpandability);

type Todo = (typeof todos)[number];
let lastPElem: HTMLElement | null = null;

function expandOrCollapse(
  todo: Todo,
  input: HTMLInputElement,
  // expandOnly = false
) {
  const pElem = todo.pElem;

  if (!pElem) throw new Error("pElem is undefined");

  if (expandedTodoId.value === input.value) {
    expandedTodoId.value = "";
    pElem.style.maxHeight = pElem.scrollHeight + "px";

    // here we need to wait for the  css maxHeight to take effect
    window.requestAnimationFrame(() => {
      pElem.style.maxHeight = "";
    });
    // lastTodo = null;
    lastPElem = null;
  } else {
    expandedTodoId.value = input.value;

    // here we set the maxHeight right away so that we are safe when we remove the css rule
    pElem.style.maxHeight = pElem.scrollHeight + "px";
    if (lastPElem !== null) {
      lastPElem.style.maxHeight = lastPElem.scrollHeight + "px";
    }

    window.requestAnimationFrame(() => {
      if (lastPElem !== null) {
        lastPElem.style.maxHeight = "";
      }

      lastPElem = pElem;
      pElem.addEventListener(
        "transitionend",
        () => {
          pElem.style.maxHeight = "";
        },
        { once: true },
      );
    });
  }
}

const addTodoDialogVisible = ref(false);

function addTodo(e: Event) {
  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  const title = (formData.get("title") as string).trim();

  if (!title) return;

  todos.push({
    id: nanoid(),
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    expandable: null,
    pElem: null,
  });
  form.reset();
  addTodoDialogVisible.value = false;
}
</script>

<template>
  <div class="main-wrapper">
    <div class="padded-wrapper">
      <div class="content rounded-box-with-shadow">
        <div class="menu-wrapper">
          <ul class="menu">
            <li
              v-for="({ tab, isSelected }, index) in tabInfos"
              :key="index"
              class="menu-tab"
              :class="{ 'menu-tab__selected': isSelected }"
            >
              <label
                class="menu-tab-label"
                :class="{ 'menu-tab-label__selected': isSelected }"
              >
                <input
                  v-model="selectedTab"
                  type="radio"
                  name="menu"
                  class="hidden-input"
                  :value="tab"
                />
                {{ tab }}
              </label>
            </li>
          </ul>
        </div>
        <div class="menu-separator" />
        <div class="todo-list-wrapper">
          <ul class="todo-list">
            <li
              v-for="todo in extendedTodos"
              :key="todo.data.id"
              class="todo-item-wrapper"
            >
              <div class="todo-item">
                <div class="todo-checkbox-wrapper">
                  <label
                    class="circle todo-checkbox-label"
                    :class="{ 'todo-checkbox-label__checked': todo.isDone }"
                  >
                    <input
                      v-model="doneTodos"
                      class="hidden-input"
                      type="checkbox"
                      :value="todo.data.id"
                    />
                  </label>
                </div>
                <div class="todo-body">
                  <div class="todo-content">
                    <h3
                      class="todo-title"
                      :class="{ 'todo-done': todo.isDone }"
                    >
                      {{ todo.data.title }}
                    </h3>
                    <p
                      :ref="
                        (el) => (todo.data.pElem = el as HTMLElement | null)
                      "
                      class="todo-descr"
                      :class="{
                        'todo-descr__collapsed': todo.isDone && !todo.selected,
                        'todo-descr__short':
                          todo.data.expandable === null ||
                          !todo.data.expandable ||
                          !todo.selected,
                        'todo-descr__overlay':
                          todo.data.expandable === true && !todo.selected,
                      }"
                    >
                      {{ todo.data.description }}
                    </p>
                    <label
                      v-show="todo.isDone || todo.data.expandable === true"
                      class="todo-descr-expand-btn"
                      :class="{
                        'todo-descr-expand-btn__expanded': todo.selected,
                      }"
                    >
                      <input
                        type="radio"
                        class="hidden-input"
                        :value="todo.data.id"
                        :checked="
                          (e: Event) =>
                            expandedTodoId ===
                            (e.target as HTMLInputElement).value
                        "
                        @click="
                          (e) =>
                            expandOrCollapse(
                              todo.data,
                              e.target as HTMLInputElement,
                            )
                        "
                      />
                      <i class="fa-solid fa-angle-down" />
                    </label>
                  </div>
                  <div class="todo-details">
                    <span class="todo-date">
                      <i class="fa-regular fa-calendar-lines" /> 5 Apr 2022
                    </span>
                    <i class="fa-solid fa-circle-small fa-2xs" />
                    <span class="todo-author">
                      <i class="fa-regular fa-user" /> Esther Howard
                    </span>
                  </div>
                </div>
              </div>
            </li>
            <li class="todo-item-wrapper add-todo">
              <button
                type="button"
                class="add-todo-btn btn-reset"
                @click="(_e) => (addTodoDialogVisible = true)"
              >
                <i class="fa-regular fa-plus" />
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div class="add-todo-dialog-wrapper">
        <div
          class="add-todo-dialog rounded-box-with-shadow"
          :class="{ 'add-todo-dialog__hidden': !addTodoDialogVisible }"
        >
          <form
            id="add-todo-dialog-form"
            class="add-todo-dialog-form"
            @submit.prevent="addTodo"
          >
            <input
              type="text"
              class="add-todo-dialog-title"
              name="title"
              placeholder="Title..."
              @keypress.enter.prevent=""
            />
            <textarea
              class="add-todo-dialog-descr"
              name="description"
              placeholder="Description..."
            />
          </form>
          <div class="add-todo-dialog-buttons-wrapper">
            <button
              form="add-todo-dialog-form"
              class="add-todo-dialog-add-btn btn-reset"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap");
/* @import url("https://site-assets.fontawesome.com/releases/v6.1.2/css/all.css"); */

:global(:root) {
  --bg-color: hsl(258 12% 94%);
  --red-color: hwb(0 40% 20% / 1);
  background-color: var(--bg-color);
  font-family: "Open Sans", sans-serif;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

.main-wrapper {
  display: flex;
  justify-content: center;
  /* margin-top: 5em; */
}

.padded-wrapper {
  height: 100vh;
  /* width: 100vw; */
  display: grid;
  grid-template-columns: calc(3% + 20px) auto calc(3% + 20px);
  grid-template-rows: minmax(5em, 1fr) auto minmax(5em, 1fr);
}

.rounded-box-with-shadow {
  background-color: white;
  border-radius: 10px;
  box-shadow: 1px 1px 6px 2px rgb(0 0 0 / 10%);
}

.content {
  grid-column: 2 / 3;
  grid-row: 2;
  display: grid;
  grid-template-areas:
    ". menu ."
    "sep sep sep"
    ". content .";
  grid-template-columns: 1.5rem minmax(auto, 50rem) 1.5rem;
}

:deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hidden-input {
  display: none;
}

.menu-wrapper {
  grid-area: menu;
  /* grid-column: 2; */
}

.menu {
  /* position: relative; */
  display: flex;
}

.menu-tab {
  --margin-width: 2px;
  margin-bottom: calc(-1 * var(--margin-width));
  border-bottom: var(--margin-width) solid transparent;
  z-index: 1;
}

.menu-tab__selected {
  border-bottom-color: hwb(258 46% 4% / 1);
}

.menu-tab-label {
  display: block;
  padding: 0.6em;
  font-size: 1.2rem;
  font-weight: bold;
  color: hsl(258 15% 91% / 1);
}

.menu-tab-label__selected {
  color: black;
}

.menu-separator {
  grid-area: sep;
  height: 2px;
  background-color: var(--bg-color);
}

.todo-list-wrapper {
  grid-area: content;
  /* grid-column: 2; */
}

.todo-list {
  display: flex;
  flex-flow: column;
}

.todo-item-wrapper {
  padding: 0.7em 0;
}

.todo-item-wrapper + .todo-item-wrapper {
  border-top: 2px solid var(--bg-color);
}

.todo-item {
  display: flex;
  flex-flow: row;
  gap: 1em;
}

.circle,
.circle::before {
  --diameter: calc(2 * var(--radius));
  height: var(--diameter);
  width: var(--diameter);
  border-radius: 50%;
}

.todo-checkbox-label {
  --radius: 8px;
  border: 2px solid var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-checkbox-label::before {
  content: "";
  --radius: 4px;
  background-color: var(--bg-color);
  visibility: hidden;
}

.todo-checkbox-label__checked::before {
  visibility: visible;
}

.todo-body {
  display: flex;
  flex-flow: column;
  flex: 1;
  gap: 0.5em;
}

.todo-content {
  display: flex;
  flex-flow: column;
  flex-grow: 1;
  /* gap: 0.3em; */
}

.todo-title {
  margin: 0;
  /* margin-bottom: 0.3em; */
  font-size: 1rem;
  font-weight: 500;
  flex-grow: 0;
}

.todo-descr-expand-btn {
  align-self: center;
  cursor: pointer;
  color: lightgrey;
  transition: transform 0.3s;
  line-height: 1;
  flex-grow: 0;
}

.todo-descr-expand-btn__expanded {
  transform: scale(1, -1);
}

.todo-descr {
  margin: 0;
  font-weight: lighter;
  font-size: 0.95rem;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.todo-descr__short {
  max-height: 3em;
}

.todo-descr__overlay {
  color: transparent;
  background-clip: text;
  background-image: linear-gradient(to top, transparent 5%, black);
}

.todo-descr__collapsed {
  max-height: 0px;
}

.todo-details {
  display: flex;
  align-items: center;
  gap: 0.7em;
  font-size: 0.9rem;
}

.todo-date {
  color: hwb(0 40% 20% / 1);
}

.todo-done {
  text-decoration: line-through;
}

.todo-author {
  color: grey;
}

.add-todo {
  display: flex;
  justify-content: center;
  /* align-items: center; */
}

.btn-reset {
  border: 0;
  padding: 0;
  background-color: transparent;
  appearance: none;
  cursor: pointer;
}

.add-todo-btn {
  color: lightgray;
}

.add-todo-dialog-wrapper {
  grid-column: 1 / -1;
  grid-row: 2 / -1;
  pointer-events: none;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.add-todo-dialog {
  pointer-events: auto;
  right: 0;
  left: 0;
  margin: 20px;
  bottom: 2em;
  position: absolute;
  display: flex;
  flex-flow: column;
  padding: 1.5em;
  transition:
    opacity 0.3s,
    bottom 0.3s;
  opacity: 1;
  /* box-sizing: content-box; */
  /* display: block; */
  /* transform: translateY(-10em); */
}

.add-todo-dialog__hidden {
  opacity: 0;
  bottom: -30em;
}

.add-todo-dialog-form {
  display: flex;
  flex-flow: column;
  flex: 1;
  gap: 0.5em;
}

.add-todo-dialog-title,
.add-todo-dialog-descr {
  border: 0;
  padding: 0;
  margin: 0;
}

.add-todo-dialog-title:focus-visible,
.add-todo-dialog-descr:focus-visible {
  outline: 0;
}

.add-todo-dialog-title {
  font-weight: 500;
}

.add-todo-dialog-descr {
  font-weight: lighter;
  flex-grow: 1;
  resize: none;
  min-height: 11em;
  /* height: auto; */
}

.add-todo-dialog-buttons-wrapper {
  display: flex;
}

.add-todo-dialog-add-btn {
  margin-left: auto;
  color: var(--red-color);
  border: 1px solid var(--red-color);
  padding: 0.4em 0.8em;
  border-radius: 5px;
}
</style>
