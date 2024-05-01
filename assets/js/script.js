const taskForm = $('#add-task-form');
const btnClose = $('#btn-close');
const btnNewTask = $('#btn-new-task');
const btnAddTask = $('#btn-add-task');
const formWarning = $('#form-warning');
const inputTaskTitle = $('#task-title');
const inputTaskDate = $('#task-date');
const inputTaskInfo = $('#task-info');
const todoDiv = $('#todo-cards');
const inProgressDiv = $('#in-progress-cards');
const doneDiv = $('#done-cards');
const filterDiv = $('.filter');

const loadLocal = () => {
    if (localStorage.getItem("tasks")) return JSON.parse(localStorage.getItem("tasks"))
    else return []
};

const storeLocal = (tasks) => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Todo: create a function to generate a unique task id
const generateTaskId = () => {
    return crypto.randomUUID()
};

// Todo: create a function to create a task card
const createTaskCard = (task) => {
    let colors = [];
    const daysLeft = Math.floor((task.dateUnix - dayjs().unix()) / (3600 * 24));
    const daysAgo = Math.floor((dayjs().unix() - task.creationUnix) / (3600 * 24));
    let ending = '';

    if (task.status === 'done') colors = ['success', 'white', 'white'];
    else if (daysLeft < 2) colors = ['danger', 'white', 'white']; 
    else if (daysLeft < 5) colors = ['warning', 'dark', 'dark'];
    else colors = ['white', 'dark', 'muted'];

    const card = $(`<div id="task-card" class="card text-center bg-${colors[0]} text-${colors[1]} mb-3" data-id="${task.id}" data-status="${task.status}">`);
    const cardFilter = $(`<div class="card-filter d-none">`);
    const header = $(`<div class="card-header font-brand">`);
    const body = $(`<div class="card-body bg-filter d-flex flex-column align-items-center justify-content-between">`);
    const titleCard = $(`<h5 class="card-title">`);
    const infoCard = $(`<p class="card-text">`);
    const btnRemove = $(`<button id="btn-remove" class="btn btn-danger" data-id="${task.id}">Remove</button>`);
    const footer = $(`<div class="card-footer font-brand text-${colors[2]}">`);

    header.text(`Due by ${task.dateText}`);
    titleCard.text(task.title);
    infoCard.text(task.info);
    
    if (daysAgo > 1) ending = 's';
    if (daysAgo === 0) footer.text(`Added today`);
    else footer.text(`Added ${daysAgo} day${ending} ago`);

    body.append(titleCard).append(infoCard).append(btnRemove);
    card.append(cardFilter).append(header).append(body).append(footer);
    card.draggable({
        drag: () => {
            cardFilter.removeClass('d-none');
            card.removeClass('placed');
            card.addClass('dragging');
        },
        stop: () => {
            card.removeClass('dragging');
            card.addClass('placed');
            cardFilter.addClass('d-none');
        },
        revert: true,
    });

    if (task.status === 'to-do') todoDiv.append(card);
    if (task.status === 'in-progress') inProgressDiv.append(card);
    if (task.status === 'done') doneDiv.append(card);
};

// Todo: create a function to render the task list and make cards draggable
const renderTaskList = () => {
    const tasks = loadLocal();

    todoDiv.html('');
    inProgressDiv.html('');
    doneDiv.html('');


    tasks.forEach((task) => createTaskCard(task));
};

const handleCloseForm = () => {
    filterDiv.removeClass('d-flex');
    filterDiv.addClass('d-none');
    inputTaskTitle.val('');
    inputTaskDate.val('');
    inputTaskInfo.val('');
};

// Todo: create a function to handle adding a new task
const handleAddTask = () => {
    let tasks = loadLocal();

    const warnFunc = () => {
        formWarning.removeClass('invisible');
        filterDiv.off('click', '#btn-add-task', handleAddTask);
        setTimeout(() => {
            formWarning.addClass('invisible');
            filterDiv.on('click', '#btn-add-task', handleAddTask);
        }, 2000);
    };

    if (!inputTaskTitle.val() || !inputTaskDate.val() || !inputTaskInfo.val() || !checkDateValue()) return warnFunc()

    const task = {
        id: generateTaskId(),
        title: inputTaskTitle.val(),
        dateText: dayjs(inputTaskDate.val()).format('MMM D, YYYY'),
        dateUnix: dayjs(inputTaskDate.val()).unix(),
        info: inputTaskInfo.val(),
        status: 'to-do',
        creationUnix: dayjs().unix(),
    };

    tasks.push(task);
    storeLocal(tasks);
    setTimeout(handleCloseForm, 100);
    renderTaskList();
};

const checkDateValue = () => {
    if (dayjs(inputTaskDate.val()).unix() < dayjs().unix()) {
        $('#date-warning').removeClass('invisible');
        return false
    } else {
        $('#date-warning').addClass('invisible');
        return true
    }
};

const handleNewTask = () => {
    filterDiv.removeClass('d-none');
    filterDiv.addClass('d-flex');
    inputTaskDate.on('change', checkDateValue);
};

// Todo: create a function to handle deleting a task
const handleDeleteTask = (e) => {
    const event = e.target;
    const dataId = event.dataset.id;
    const tasks = loadLocal();

    tasks.forEach((task, i) => {
        if (task.id === dataId) tasks.splice(i, 1)
    });

    storeLocal(tasks);
    renderTaskList();
};

// Todo: create a function to handle dropping a task into a new status lane
const handleDrop = (e, ui) => {
    const event = e.target;
    const tasks = loadLocal();
    const eventStatus = event.dataset.status;
    const cardId = ui.draggable[0].dataset.id;

    if (eventStatus === ui.draggable[0].dataset.status) return

    tasks.forEach((task, i) => {
        if (task.id === cardId) tasks[i].status = eventStatus;
    });

    storeLocal(tasks);
    renderTaskList();
};

// Todo: when the page loads, render the task list, add event listeners, make lanes droppable, and make the due date field a date picker
$(document).ready(() => {
    $('main').on('click', '#btn-new-task', handleNewTask);
    btnClose.on('click', handleCloseForm);
    filterDiv.on('click', '#btn-add-task', handleAddTask);
    $('main').on('click', '#btn-remove', handleDeleteTask);
    renderTaskList();
    $('.status-column').droppable({
        accept: '.ui-draggable',
        drop: handleDrop,
        classes: {
            'ui-droppable-hover': 'highlight'
        }
    });
});
