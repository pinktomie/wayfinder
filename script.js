
document.addEventListener("DOMContentLoaded", () => {

    

  const tabs = document.querySelectorAll(".tab");
  const navButtons = document.querySelectorAll(".nav-btn");

  function showTab(tabName) {
    // Hide all tabs
    tabs.forEach(tab => tab.classList.remove("active"));

    // Remove active state from nav buttons
    navButtons.forEach(btn => btn.classList.remove("active"));

    // Show selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) selectedTab.classList.add("active");

    // Highlight active nav button
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add("active");
  }

  // Attach click events
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabName = btn.getAttribute("data-tab");
      showTab(tabName);
    });
  });

  // Start on Home
  showTab("home");



  /*************************
   * DATA MODELS
   *************************/

  const story = {
    focus: {
      2: "You learn how to enter stillness.",
      3: "Distraction loses its grip."
    },
    craft: {
      2: "Your hands begin to trust your mind."
    }
  };

  let dayCompleteShownDate = null;

  const skills = {
    focus: { name: "Focus", level: 1, xp: 0, xpToNextLevel: 100, storyUnlocked: [] },
    craft: { name: "Craft", level: 1, xp: 0, xpToNextLevel: 100, storyUnlocked: [] },
    vitality: { name: "Vitality", level: 1, xp: 0, xpToNextLevel: 100, storyUnlocked: [] }
  };

  let tasks = [
    {
      id: 1,
      title: "Write for 20 minutes",
      skill: "craft",
      xp: 20,
      recurrence: "daily",
      lastCompleted: null,
      completed: false
    },
    {
      id: 2,
      title: "Deep focus session",
      skill: "focus",
      xp: 30,
      recurrence: "once",
      completed: false
    },
    {
      id: 3,
      title: "Go for a walk",
      skill: "vitality",
      xp: 15,
      recurrence: "once",
      completed: false
    }
  ];

  let routines = [
    {
      id: 1,
      name: "Morning Routine",
      recurrence: "daily",
      autoReset: true,
      completed: false,
      bonusXP: 20,
      steps: [
        { id: 101, title: "Make bed", skill: "focus", xp: 5, completed: false },
        { id: 102, title: "Brush teeth", skill: "vitality", xp: 5, completed: false },
        { id: 103, title: "Stretch for 5 min", skill: "vitality", xp: 10, completed: false },
        { id: 104, title: "Read 5 pages", skill: "craft", xp: 10, completed: false }
      ]
    }
  ];

  /*************************
   * SAVE / LOAD
   *************************/

  function saveGame() {
    localStorage.setItem("lifeQuest_skills", JSON.stringify(skills));
    localStorage.setItem("lifeQuest_tasks", JSON.stringify(tasks));
    localStorage.setItem("lifeQuest_routines", JSON.stringify(routines));
    localStorage.setItem("lifeQuest_lastReset", today());
  }

  function loadGame() {
    const savedSkills = localStorage.getItem("lifeQuest_skills");
    const savedTasks = localStorage.getItem("lifeQuest_tasks");
    const savedRoutines = localStorage.getItem("lifeQuest_routines");

    if (savedSkills) Object.assign(skills, JSON.parse(savedSkills));
    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedRoutines) routines = JSON.parse(savedRoutines);
  }

  /*************************
   * CORE LOGIC
   *************************/

  function gainXP(skillKey, amount) {
    const skill = skills[skillKey];
    if (!skill) return;

    skill.xp += amount;

    if (skill.xp >= skill.xpToNextLevel) {
      skill.xp -= skill.xpToNextLevel;
      skill.level += 1;

      if (story[skillKey]?.[skill.level]) {
        skill.storyUnlocked.push(story[skillKey][skill.level]);
      }
    }
  }

  function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    task.completed = true;
    task.lastCompleted = today();

    gainXP(task.skill, task.xp);
    saveGame();
    render();
  }

  /*************************
   * DAILY LOGIC
   *************************/

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  function resetDailyTasks() {
    tasks.forEach(task => {
      if (task.recurrence === "daily" && task.lastCompleted !== today()) {
        task.completed = false;
      }
    });
  }

  function isDayComplete() {
    return tasks.some(t => t.recurrence === "daily") &&
           tasks.every(t => t.recurrence !== "daily" || t.completed);
  }

  /*************************
   * ROUTINE LOGIC
   *************************/

  function resetRoutines() {
    routines.forEach(routine => {
      if (!routine.autoReset) return;

      if (routine.recurrence === "daily" || routine.recurrence === "weekly") {
        routine.completed = false;
        routine.steps.forEach(s => s.completed = false);
      }
    });
  }

  function checkRoutineCompletion(routineId) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const allDone = routine.steps.every(step => step.completed);

    if (allDone && !routine.completed) {
      routine.completed = true;
      gainXP("focus", routine.bonusXP);
      saveGame();
      render();
    }
  }

  function completeRoutineStep(routineId, stepId) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    const step = routine.steps.find(s => s.id === stepId);
    if (!step || step.completed) return;

    step.completed = true;
    gainXP(step.skill, step.xp);

    checkRoutineCompletion(routineId);
  }

  /*************************
   * RENDERING
   *************************/

  function renderTasks() {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";

    tasks.forEach(task => {
      const div = document.createElement("div");
      div.className = "task";
      if (task.completed) div.classList.add("completed");

      div.innerHTML = `
        <div class="task-title">${task.title}</div>
        <div class="task-meta">+${task.xp} ${skills[task.skill].name} XP</div>
      `;

      div.addEventListener("click", () => completeTask(task.id));
      taskList.appendChild(div);
    });
  }

  function renderSkills() {
    const skillList = document.getElementById("skills");
    skillList.innerHTML = "";

    Object.values(skills).forEach(skill => {
      const div = document.createElement("div");
      div.className = "skill";

      div.innerHTML = `
        <strong>${skill.name}</strong>
        <div class="progress">
          <div class="progress-bar" style="width: ${(skill.xp / skill.xpToNextLevel) * 100}%"></div>
        </div>
        <small>Level ${skill.level}</small>
      `;

      skillList.appendChild(div);
    });
  }

  function renderStory() {
    const el = document.getElementById("story-content");
    if (!el) return;

    el.innerHTML = "";
    Object.values(skills).forEach(skill => {
      skill.storyUnlocked.forEach(text => {
        const p = document.createElement("p");
        p.textContent = text;
        el.appendChild(p);
      });
    });
  }

  function renderRoutines() {
    const routineArea = document.getElementById("routine-list");
    routineArea.innerHTML = "";

    routines.forEach(routine => {
      const routineEl = document.createElement("div");
      routineEl.className = "routine";

      routineEl.innerHTML = `
        <div class="routine-title">
          ${routine.name}
          ${routine.completed ? "✔️" : ""}
        </div>
      `;

      routine.steps.forEach(step => {
        const stepEl = document.createElement("div");
        stepEl.className = "routine-step" + (step.completed ? " completed" : "");
        stepEl.innerHTML = `${step.title} (+${step.xp} XP)`;
        stepEl.addEventListener("click", () => completeRoutineStep(routine.id, step.id));
        routineEl.appendChild(stepEl);
      });

      routineArea.appendChild(routineEl);
    });
  }

  function render() {
    renderTasks();
    renderSkills();
    renderRoutines();
    renderStory();

    const overlay = document.getElementById("day-complete");

    if (
      isDayComplete() &&
      dayCompleteShownDate !== today()
    ) {
      overlay.hidden = false;
      dayCompleteShownDate = today();
    } else {
      overlay.hidden = true;
    }
  }

  /*************************
   * EVENTS
   *************************/

  document.getElementById("close-day").onclick = () => {
    dayCompleteShownDate = today();
    document.getElementById("day-complete").hidden = true;
  };

  /*************************
   * INIT
   *************************/

  loadGame();

  // midnight reset logic
  const lastReset = localStorage.getItem("lifeQuest_lastReset");
  if (lastReset !== today()) {
    resetDailyTasks();
    resetRoutines();
    localStorage.setItem("lifeQuest_lastReset", today());
  }

  render();
  saveGame();

  /*************************
   * ADD TASK BUTTON
   *************************/

  document.getElementById("add-task-btn").addEventListener("click", () => {
    const title = document.getElementById("task-title").value.trim();
    const skill = document.getElementById("task-skill").value;
    const xp = parseInt(document.getElementById("task-xp").value, 10);
    const recurrence = document.getElementById("task-recurrence").value;

    if (!title) return;
    if (!xp || xp <= 0) return;

    tasks.push({
      id: Date.now(),
      title,
      skill,
      xp,
      completed: false,
      recurrence: recurrence
    });

    document.getElementById("task-title").value = "";
    document.getElementById("task-xp").value = "20";

    saveGame();
    render();
  });

  /*************************
   * ADD ROUTINE BUTTON
   *************************/

  document.getElementById("add-routine-btn").addEventListener("click", () => {
    const name = document.getElementById("routine-name").value.trim();
    const recurrence = document.getElementById("routine-recurrence").value;
    const autoReset = document.getElementById("routine-autoreset").value === "true";

    if (!name) return;

    routines.push({
      id: Date.now(),
      name,
      recurrence,
      autoReset,
      completed: false,
      bonusXP: 10,
      steps: []
    });

    document.getElementById("routine-name").value = "";
    saveGame();
    render();
  });

  /*************************
   * ADD ROUTINE STEP BUTTON
   *************************/

  function populateRoutineDropdown() {
    const select = document.getElementById("step-routine");
    select.innerHTML = "";

    routines.forEach(routine => {
      const option = document.createElement("option");
      option.value = routine.id;
      option.textContent = routine.name;
      select.appendChild(option);
    });
  }

  populateRoutineDropdown();

  document.getElementById("add-step-btn").addEventListener("click", () => {
    const title = document.getElementById("step-title").value.trim();
    const xp = parseInt(document.getElementById("step-xp").value, 10);
    const skill = document.getElementById("step-skill").value;
    const routineId = parseInt(document.getElementById("step-routine").value, 10);

    if (!title || !xp || xp <= 0) return;

    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    routine.steps.push({
      id: Date.now(),
      title,
      skill,
      xp,
      completed: false
    });

    document.getElementById("step-title").value = "";
    saveGame();
    render();
  });

});
