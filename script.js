// Javascript
let currentTaskToDelete = null;
function showConfirmation(message) {
  const modal = document.getElementById("confirmationModal");
  const messageElement = document.getElementById("confirmationMessage");
  if (message.includes("delete")) {
    message = "Task successfully deleted! 🗑️";
  } else if (message.includes("update")) {
    message = "Task successfully updated! 🎉";
  } else if (message.includes("created")) {
    message = "Task successfully created! 🎉";
  }
  messageElement.textContent = message;
  modal.classList.add("show");
  setTimeout(() => {
    modal.classList.remove("show");
  }, 3000);
}

function closeModal() {
  document.getElementById("taskModal").classList.remove("show");
}

function confirmDelete() {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const filteredTasks = tasks.filter((t) => t.id !== currentTaskToDelete);
  localStorage.setItem("tasks", JSON.stringify(filteredTasks));
  const taskElement = document.querySelector(
    `[data-task-id="${currentTaskToDelete}"]`
  );
  if (taskElement) {
    taskElement.remove();
  }
  document.getElementById("deleteConfirmationModal").classList.remove("show");

  updateAllCounts();
  showConfirmation("Task successfully deleted! 🗑️");
  currentTaskToDelete = null;
}

function updateAllCounts() {
  const columns = ["todo", "progress", "done"];
  columns.forEach((columnType) => {
    const column = document.getElementById(columnType);
    const tasksInColumn = column.querySelectorAll(".task-list > .task");
    column.querySelector(".column__count").textContent = tasksInColumn.length;
  });
  const totalTasks = document.querySelectorAll(".task").length;
  const completedTasks = document
    .querySelector("#done")
    .querySelectorAll(".task").length;
  const inProgressTasks = document
    .querySelector("#progress")
    .querySelectorAll(".task").length;
  document.getElementById("totalTasks").textContent = totalTasks;
  document.getElementById("completedTasks").textContent = completedTasks;
  document.getElementById("inProgressTasks").textContent = inProgressTasks;
}

function cancelDelete() {
  currentTaskToDelete = null;
  document.getElementById("deleteConfirmationModal").classList.remove("show");
}

function deleteTask(taskId) {
  currentTaskToDelete = taskId;
  document.getElementById("deleteConfirmationModal").classList.add("show");
}
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", confirmDelete);
  document
    .getElementById("cancelDeleteBtn")
    .addEventListener("click", cancelDelete);

  const themeToggle = document.getElementById("themeToggle");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
      updateThemeIcon(savedTheme);
    } else if (prefersDarkScheme.matches) {
      document.documentElement.setAttribute("data-theme", "dark");
      updateThemeIcon("dark");
    }
  }

  function updateThemeIcon(theme) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  });
  initTheme();
  const modal = document.getElementById("taskModal");
  const taskForm = document.getElementById("taskForm");
  const columns = document.querySelectorAll(".column");

  let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  if (!tasks || tasks.length === 0) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  columns.forEach((column) => {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingTask = document.querySelector(".dragging");
      const taskList = column.querySelector(".task-list");
      const afterElement = getDragAfterElement(taskList, e.clientY);
      if (afterElement) {
        taskList.insertBefore(draggingTask, afterElement);
      } else {
        taskList.appendChild(draggingTask);
      }
    });
    column.addEventListener("drop", (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      const task = tasks.find((t) => t.id === taskId);
      const prevColumn = task.column;
      task.column = column.id;
      saveTasks();
      updateAllCounts();
      updateColumnCount(prevColumn);
      const draggingTask = document.querySelector(`[data-task-id="${taskId}"]`);
      draggingTask.classList.remove("dragging");
      draggingTask.style.transform = "scale(1.02)";
      setTimeout(() => {
        draggingTask.style.transform = "scale(1)";
      }, 200);
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".task:not(.dragging)"),
    ];
    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return {
            offset: offset,
            element: child,
          };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
      }
    ).element;
  }
  taskForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const taskId = this.dataset.editId;
    if (taskId) {
      const existingTaskElement = document.querySelector(
        `[data-task-id="${taskId}"]`
      );

      let parentColumn = null;
      if (existingTaskElement) {
        parentColumn = existingTaskElement.closest(".column").id;
      }
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = {
          ...tasks[taskIndex],
          title: document.getElementById("taskTitle").value,
          description: document.getElementById("taskDescription").value,
          deadline: document.getElementById("taskDeadline").value,
          color: document.getElementById("taskColor").value,
          column: document.getElementById("columnType").value,
        };

        if (existingTaskElement && parentColumn !== tasks[taskIndex].column) {
          existingTaskElement.remove();
          updateColumnCount(parentColumn);
        }
        if (existingTaskElement && parentColumn === tasks[taskIndex].column) {
          renderTask(tasks[taskIndex], true);
        } else {
          renderTask(tasks[taskIndex]);
        }
      }
      delete this.dataset.editId;
    } else {
      await createTask({
        columnType: document.getElementById("columnType").value,
        title: document.getElementById("taskTitle").value,
        description: document.getElementById("taskDescription").value,
        deadline: document.getElementById("taskDeadline").value,
        color: document.getElementById("taskColor").value,
        imageFile: document.getElementById("taskImage").files[0],
      });
    }
    saveTasks();
    closeModal();
    showConfirmation(
      taskId ? "Task successfully updated! 🎉" : "Task successfully created! 🎉"
    );
  });
  async function createTask(taskData) {
    const imageBase64 = taskData.imageFile
      ? await convertImageToBase64(taskData.imageFile)
      : null;
    const newTask = {
      id: Date.now().toString(),
      ...taskData,
      column: taskData.columnType,
      image: imageBase64,
    };
    tasks.push(newTask);
    saveTasks();
    renderTask(newTask);
  }

  function convertImageToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    updateAllCounts();
  }

  function renderTask(task, isUpdate = false) {
    if (isUpdate) {
      const existingTask = document.querySelector(
        `[data-task-id="${task.id}"]`
      );
      if (existingTask) {
        const imageHtml = task.image
          ? `<img src="${task.image}" alt="Task image" class="task__image">`
          : "";
        existingTask.innerHTML = `
        <div class="task__header">
          <h3 class="task__title">${task.title}</h3>
          <div class="task__actions">
            <button class="action-btn edit-btn">✏️</button>
            <button class="action-btn delete-btn">🗑️</button>
</div>
        </div>
        <div class="task__content">
          <p>${task.description}</p>
          ${imageHtml}
        </div>
        <div class="task__footer">
          <span class="task__date">📅 ${
            task.deadline
              ? new Date(task.deadline).toLocaleDateString() !== "Invalid Date"
                ? new Date(task.deadline).toLocaleDateString()
                : "No date"
              : "No date"
          }</span>
        </div>
      `;
        existingTask.style.borderLeft = `4px solid ${task.color}`;
        // Réattacher les écouteurs d'événements
        existingTask
          .querySelector(".edit-btn")
          .addEventListener("click", () => openEditModal(task.id));
        existingTask
          .querySelector(".delete-btn")
          .addEventListener("click", () => deleteTask(task.id));
        return;
      }
    }
    const column = document.getElementById(task.column);
    const taskList = column.querySelector(".task-list");
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    taskElement.style.borderLeft = `4px solid ${task.color}`;
    const imageHtml = task.image
      ? `<img src="${task.image}" alt="Task image" class="task__image">`
      : "";
    taskElement.innerHTML = `
    <div class="task__header">
      <h3 class="task__title">${task.title}</h3>
      <div class="task__actions">
        <button class="action-btn edit-btn">✏️</button>
        <button class="action-btn delete-btn">🗑️</button>
</div>
    </div>
    <div class="task__content">
      <p>${task.description}</p>
      ${imageHtml}
    </div>
    <div class="task__footer">
      <span class="task__date">📅 ${
        task.deadline
          ? new Date(task.deadline).toLocaleDateString() !== "Invalid Date"
            ? new Date(task.deadline).toLocaleDateString()
            : "No date"
          : "No date"
      }</span>
    </div>
  `;
    taskElement.addEventListener("dragstart", handleDragStart);
    taskElement.addEventListener("dragend", handleDragEnd);

    const addTaskButton = taskList.querySelector(".add-task");
    if (addTaskButton.nextSibling) {
      taskList.insertBefore(taskElement, addTaskButton.nextSibling);
    } else {
      taskList.appendChild(taskElement);
    }

    saveTasks();
    taskElement
      .querySelector(".edit-btn")
      .addEventListener("click", () => openEditModal(task.id));
    taskElement
      .querySelector(".delete-btn")
      .addEventListener("click", () => deleteTask(task.id));
  }

  function updateColumnCount(columnType) {
    const column = document.getElementById(columnType);
    const tasksInColumn = column.querySelectorAll(".task-list > .task");
    column.querySelector(".column__count").textContent = tasksInColumn.length;
  }

  function updateHeaderStats() {
    const totalTasks = document.querySelectorAll(".task").length;
    const completedTasks = document
      .querySelector("#done")
      .querySelectorAll(".task").length;
    const inProgressTasks = document
      .querySelector("#progress")
      .querySelectorAll(".task").length;
    document.getElementById("totalTasks").textContent = totalTasks;
    document.getElementById("completedTasks").textContent = completedTasks;
    document.getElementById("inProgressTasks").textContent = inProgressTasks;
  }

  function openEditModal(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const form = document.getElementById("taskForm");
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("taskDeadline").value = task.deadline;
    document.getElementById("taskColor").value = task.color;
    document.getElementById("columnType").value = task.column;
    document.getElementById("editTaskId").value = taskId;
    form.dataset.editId = taskId;

    document.querySelector('#taskForm button[type="submit"]').textContent =
      "Update Task";

    document.querySelector("#taskModal h2").textContent = "Edit Task";
    document.getElementById("taskModal").classList.add("show");
  }

  function openModal(columnType) {
    document.getElementById("columnType").value = columnType;
    document.getElementById("taskForm").reset();
    document.getElementById("editTaskId").value = "";

    document.querySelector('#taskForm button[type="submit"]').textContent =
      "Add Task";

    document.querySelector("#taskModal h2").textContent = "New Task";
    document.getElementById("taskModal").classList.add("show");

    setTimeout(() => {
      document.getElementById("taskTitle").focus();
    }, 100);
  }

  function loadTasks() {
    document.querySelectorAll(".task-list").forEach((taskList) => {
      const addTaskButton = taskList.querySelector(".add-task");
      taskList.innerHTML = "";
      taskList.appendChild(addTaskButton);
    });

    tasks.forEach((task) => {
      renderTask(task);
    });
    updateAllCounts();
  }
  initTheme();
  loadTasks();
  document.querySelectorAll(".add-task").forEach((button) => {
    button.addEventListener("click", function () {
      const columnType = this.closest(".column").id;
      openModal(columnType);
    });
  });
  document.querySelector(".modal__close").addEventListener("click", closeModal);

  function handleDragStart(e) {
    this.classList.add("dragging");
    this.style.opacity = "0.5";
    e.dataTransfer.setData("text/plain", this.dataset.taskId);
  }

  function handleDragEnd() {
    this.classList.remove("dragging");
    this.style.opacity = "1";
  }

  window.deleteTask = deleteTask;

  function closeHelpModal() {
    document.getElementById("helpModal").classList.remove("show");
  }
  document.getElementById("helpToggle").addEventListener("click", function () {
    document.getElementById("helpModal").classList.add("show");
  });

  window.closeHelpModal = closeHelpModal;
});
