document.addEventListener('DOMContentLoaded', () => {
  // Keep the footer year current on every page.
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // Accessible mobile navigation.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      menuButton.textContent = isOpen ? '×' : '☰';
    });
  }

  // Academic planner: add, complete, filter and delete tasks; persist in localStorage.
  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    const taskInput = document.getElementById('task-input');
    const priorityInput = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const taskMessage = document.getElementById('task-message');
    const remainingCount = document.getElementById('remaining-count');
    const taskCount = document.getElementById('task-count');
    const progressLabel = document.getElementById('progress-label');
    const progressBar = document.getElementById('progress-bar');
    const todayDate = document.getElementById('today-date');
    const clearCompleted = document.getElementById('clear-completed');
    const filterButtons = [...document.querySelectorAll('[data-filter]')];
    const storageKey = 'studentSpaceAcademicTasks';
    let currentFilter = 'all';
    let tasks = [];

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.text === 'string');
    } catch (error) {
      tasks = [];
    }
    if (todayDate) todayDate.textContent = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    function saveTasks() {
      try { localStorage.setItem(storageKey, JSON.stringify(tasks)); }
      catch (error) { taskMessage.textContent = 'Tasks work for this session, but browser storage is unavailable.'; }
    }

    function renderTasks() {
      taskList.replaceChildren();
      const visibleTasks = tasks.filter(task => currentFilter === 'all' || (currentFilter === 'active' && !task.completed) || (currentFilter === 'completed' && task.completed));
      visibleTasks.forEach(task => {
        const item = document.createElement('li');
        item.className = `task-item${task.completed ? ' completed' : ''}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.className = 'task-check'; checkbox.checked = Boolean(task.completed);
        checkbox.setAttribute('aria-label', `Mark ${task.text} as ${task.completed ? 'not completed' : 'completed'}`);
        checkbox.addEventListener('change', () => { task.completed = checkbox.checked; saveTasks(); renderTasks(); });
        const description = document.createElement('span'); description.className = 'task-description'; description.textContent = task.text;
        const badge = document.createElement('span'); badge.className = `priority-badge${task.priority === 'high' ? ' high' : ''}`; badge.textContent = task.priority === 'high' ? 'HIGH' : 'NORMAL';
        const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'delete-task'; deleteButton.textContent = '×'; deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
        deleteButton.addEventListener('click', () => { tasks = tasks.filter(t => t.id !== task.id); saveTasks(); renderTasks(); });
        item.append(checkbox, description, badge, deleteButton);
        taskList.append(item);
      });
      emptyState.hidden = visibleTasks.length > 0;
      const remaining = tasks.filter(t => !t.completed).length;
      const completed = tasks.filter(t => t.completed).length;
      const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
      remainingCount.textContent = remaining;
      taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
      progressLabel.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;
      filterButtons.forEach(button => {
        const active = button.dataset.filter === currentFilter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    taskForm.addEventListener('submit', event => {
      event.preventDefault();
      const text = taskInput.value.trim();
      if (!text) { taskMessage.textContent = 'Please enter a task before adding it.'; taskInput.focus(); return; }
      tasks.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, priority: priorityInput.value, completed: false });
      saveTasks(); renderTasks(); taskForm.reset(); taskInput.focus();
      taskMessage.textContent = 'Task added successfully.';
      window.setTimeout(() => { taskMessage.textContent = ''; }, 2500);
    });
    filterButtons.forEach(button => button.addEventListener('click', () => { currentFilter = button.dataset.filter; renderTasks(); }));
    clearCompleted.addEventListener('click', () => { tasks = tasks.filter(t => !t.completed); saveTasks(); renderTasks(); taskMessage.textContent = 'Completed tasks cleared.'; });
    renderTasks();
  }

  // Contact form validation: every field required, valid email and digits-only phone.
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const fields = {
      name: document.getElementById('full-name'),
      email: document.getElementById('email'),
      phone: document.getElementById('phone'),
      message: document.getElementById('message')
    };
    const errors = {
      name: document.getElementById('name-error'),
      email: document.getElementById('email-error'),
      phone: document.getElementById('phone-error'),
      message: document.getElementById('message-error')
    };
    const feedback = document.getElementById('contact-feedback');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phonePattern = /^\d+$/;

    function validateField(key) {
      const field = fields[key];
      const value = field.value.trim();
      let message = '';
      if (!value) message = 'This field is required.';
      else if (key === 'email' && !emailPattern.test(value)) message = 'Enter a valid email address.';
      else if (key === 'phone' && !phonePattern.test(value)) message = 'Phone number must contain digits only.';
      else if (key === 'name' && value.length < 2) message = 'Please enter at least 2 characters.';
      else if (key === 'message' && value.length < 5) message = 'Please enter a message of at least 5 characters.';
      errors[key].textContent = message;
      field.classList.toggle('invalid', Boolean(message));
      field.setAttribute('aria-invalid', String(Boolean(message)));
      return !message;
    }

    Object.keys(fields).forEach(key => {
      fields[key].addEventListener('blur', () => validateField(key));
      fields[key].addEventListener('input', () => {
        if (fields[key].classList.contains('invalid')) validateField(key);
      });
    });

    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      const valid = Object.keys(fields).map(validateField).every(Boolean);
      feedback.className = 'form-message';
      if (!valid) {
        feedback.textContent = 'Please correct the highlighted fields and try again.';
        feedback.classList.add('contact-feedback-error');
        const firstInvalid = contactForm.querySelector('.invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      // Front-end-only demo: no server/email service is connected.
      feedback.textContent = 'All fields are valid! This demo form does not send messages to a server yet.';
      feedback.classList.add('contact-feedback-success');
      contactForm.reset();
      Object.values(errors).forEach(error => error.textContent = '');
      Object.values(fields).forEach(field => { field.classList.remove('invalid'); field.removeAttribute('aria-invalid'); });
    });
  }
});
