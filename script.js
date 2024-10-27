// Debug logging
console.log('Firebase initialized');

// Button functionality
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('nav button');
    const sections = ['home-section', 'upload-section', 'items-section', 'planner-section', 'packing-section', 'ai-outfits-section'];

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionToShow = button.id.replace('-button', '-section');
            toggleSections(sectionToShow);
        });
    });

    function toggleSections(sectionToShow) {
        console.log(`Toggling section: ${sectionToShow}`); // Debug log
        const sections = ['home-section', 'upload-section', 'items-section', 'planner-section', 'packing-section', 'ai-outfits-section'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                if (section === sectionToShow) {
                    element.classList.remove('hidden');
                    if (section === 'planner-section') {
                        initializeCalendar();
                    }
                } else {
                    element.classList.add('hidden');
                }
            } else {
                console.error(`Section with id ${section} not found`);
            }
        });

        if (sectionToShow === 'ai-outfits-section') {
            setupAIOutfits();
        }
    }

    // Show home section by default
    toggleSections('home-section');

    // Add event listener for the "Get Started" button
    const getStartedButton = document.getElementById('get-started');
    if (getStartedButton) {
        getStartedButton.addEventListener('click', function() {
            toggleSections('upload-section');
        });
    } else {
        console.error('Get Started button not found');
    }

    const createOutfitBtn = document.getElementById('create-outfit');
    if (createOutfitBtn) {
        createOutfitBtn.addEventListener('click', function() {
            console.log('Create Outfit button clicked'); // Debug log
            const outfitCreator = document.getElementById('outfit-creator');
            if (outfitCreator) {
                outfitCreator.style.display = 'block';
                populateAvailableItems();
            } else {
                console.error('Outfit creator element not found');
            }
        });
    } else {
        console.error('Create Outfit button not found');
    }
});

// Toggle sections function
function toggleSections(sectionToShow) {
    console.log(`Toggling section: ${sectionToShow}`);
    const sections = ['upload-section', 'items-section', 'planner-section', 'packing-section', 'ai-outfits-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.toggle('hidden', section !== sectionToShow);
        } else {
            console.error(`Section with id ${section} not found`);
        }
    });

    if (sectionToShow === 'ai-outfits-section') {
        setupAIOutfits(); // Regenerate AI outfits when the section is shown
    }
}

document.getElementById('submit-item').addEventListener('click', function(event) {
    event.preventDefault();
    const imageSrc = document.getElementById('file-input').files[0] ? URL.createObjectURL(document.getElementById('file-input').files[0]) : '';
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const color = document.getElementById('color').value;

    if (imageSrc && description && category && color) {
        addItemToGrid(imageSrc, description, category, color);
        
        // Save to local storage
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        items.push({ imageSrc, description, category, color });
        localStorage.setItem('items', JSON.stringify(items));

        // Clear form fields
        document.getElementById('file-input').value = '';
        document.getElementById('description').value = '';
        document.getElementById('category').value = '';
        document.getElementById('color').value = '';

        updateItemsSection();
    } else {
        alert('Please fill in all fields');
    }
});

function resetUploadForm() {
    document.getElementById('file-input').value = '';
    document.getElementById('description').value = '';
    document.getElementById('color').value = '';
}

document.getElementById('create-packing-list').addEventListener('click', function() {
    const packingItemsDiv = document.getElementById('packing-items');
    packingItemsDiv.innerHTML = ''; // Clear existing items
    const items = document.querySelectorAll('#items-grid div');
    items.forEach(item => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const label = document.createElement('label');
        label.innerHTML = item.innerHTML;
        packingItemsDiv.appendChild(checkbox);
        packingItemsDiv.appendChild(label);
        packingItemsDiv.appendChild(document.createElement('br'));
    });
});

function addItemToGrid(imageSrc, description, category, color) {
    console.log('Adding item:', description); // Add this line for debugging

    const itemsGrid = document.getElementById('items-grid');
    const item = document.createElement('div');
    item.classList.add('item-card');
    item.innerHTML = `
        <img src="${imageSrc}" alt="${description}">
        <p>${description}</p>
        <p>${category}</p>
        <p>Color: <span style="display:inline-block; width:20px; height:20px; background-color:${color};"></span> ${color}</p>
        <button class="delete-item">Delete</button>
    `;
    
    // Add delete functionality
    const deleteButton = item.querySelector('.delete-item');
    deleteButton.addEventListener('click', function(event) {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this item?')) {
            item.remove();
            const items = JSON.parse(localStorage.getItem('items') || '[]');
            const updatedItems = items.filter(i => 
                i.imageSrc !== imageSrc || 
                i.description !== description || 
                i.category !== category || 
                i.color !== color
            );
            localStorage.setItem('items', JSON.stringify(updatedItems));
            updateItemsSection();
        }
    });
    
    itemsGrid.appendChild(item);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.innerHTML);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

const plannerGrid = document.getElementById('planner-grid');
plannerGrid.addEventListener('dragover', function(e) {
    e.preventDefault();
});

plannerGrid.addEventListener('drop', function(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const newElement = document.createElement('div');
    newElement.innerHTML = data;
    plannerGrid.appendChild(newElement);
});

document.addEventListener('DOMContentLoaded', async function() {
    // Set up button event listeners
    document.getElementById('add-item').addEventListener('click', () => toggleSections('upload-section'));
    document.getElementById('view-items').addEventListener('click', () => toggleSections('items-section'));
    document.getElementById('outfit-planner').addEventListener('click', () => toggleSections('planner-section'));
    document.getElementById('packing-list').addEventListener('click', () => toggleSections('packing-section'));
    document.getElementById('ai-outfits').addEventListener('click', () => toggleSections('ai-outfits-section'));
    
    await loadModel();
    loadItems(); // Load items from local storage
    
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        height: 'auto', // This allows the calendar to adjust its height
        editable: true,
        droppable: true,
        events: JSON.parse(localStorage.getItem('calendarEvents') || '[]'),
        eventClick: function(info) {
            if (confirm(`Delete event '${info.event.title}'?`)) {
                info.event.remove();
                saveCalendarEvents(calendar);
            }
        },
        eventDrop: function(info) {
            saveCalendarEvents(calendar);
        },
        eventResize: function(info) {
            saveCalendarEvents(calendar);
        }
    });
    calendar.render();

    // Store the calendar instance on the element for later use
    calendarEl._calendar = calendar;

    // Set up outfit creation functionality
    setupOutfitCreation();
    setupAIOutfits();
});

let model;

async function loadModel() {
    model = await mobilenet.load();
}

function loadItems() {
    const itemsGrid = document.getElementById('items-grid');
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.forEach(data => {
        const item = document.createElement('div');
        item.innerHTML = `
            <img src="${data.imageSrc}" alt="${data.description}">
            <p>${data.description}</p>
            <p>${data.category}</p>
            <p>Color: <span style="display:inline-block; width:20px; height:20px; background-color:${data.color};"></span> ${data.color}</p>
        `;
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        itemsGrid.appendChild(item);
    });
}

function setupOutfitCreation() {
    const availableItems = document.getElementById('available-items');
    const outfitItems = document.getElementById('outfit-items');
    const saveOutfitBtn = document.getElementById('save-outfit');
    const savedOutfits = document.getElementById('saved-outfits');

    // Load items into available-items
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.forEach(item => {
        const itemElement = createItemElement(item);
        itemElement.draggable = true;
        itemElement.addEventListener('dragstart', handleDragStart);
        availableItems.appendChild(itemElement);
    });

    // Set up drag and drop for outfit creation
    outfitItems.addEventListener('dragover', handleDragOver);
    outfitItems.addEventListener('drop', handleDrop);

    // Save outfit
    saveOutfitBtn.addEventListener('click', () => {
        const outfitName = prompt('Enter a name for this outfit:');
        if (outfitName) {
            const outfitItems = Array.from(document.querySelectorAll('#outfit-items .item'))
                .map(item => item.dataset.id);
            const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
            outfits.push({ name: outfitName, items: outfitItems });
            localStorage.setItem('outfits', JSON.stringify(outfits));
            displaySavedOutfits();
            document.getElementById('outfit-items').innerHTML = '';
        }
    });

    // Display saved outfits
    displaySavedOutfits();
}

function createItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.classList.add('item');
    itemElement.dataset.id = item.id;
    itemElement.innerHTML = `
        <img src="${item.imageSrc}" alt="${item.description}" style="width: 50px; height: 50px;">
        <span>${item.description}</span>
    `;
    return itemElement;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text');
    const item = document.querySelector(`.item[data-id="${itemId}"]`);
    if (item && e.target.id === 'outfit-items') {
        e.target.appendChild(item.cloneNode(true));
    }
}

function displaySavedOutfits() {
    const savedOutfits = document.getElementById('saved-outfits');
    savedOutfits.innerHTML = '<h2>Saved Outfits</h2>';
    const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
    outfits.forEach((outfit, index) => {
        const outfitElement = document.createElement('div');
        outfitElement.classList.add('saved-outfit');
        outfitElement.innerHTML = `
            <h3>${outfit.name}</h3>
            <div class="outfit-items">
                ${outfit.items.map(item => `<img src="${item.imageSrc}" alt="${item.description}" title="${item.description}">`).join('')}
            </div>
            <button class="add-to-calendar">Add to Calendar</button>
            <button class="delete-outfit">Delete Outfit</button>
        `;
        outfitElement.querySelector('.add-to-calendar').addEventListener('click', () => addOutfitToCalendar(outfit));
        outfitElement.querySelector('.delete-outfit').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this outfit?')) {
                outfits.splice(index, 1);
                localStorage.setItem('outfits', JSON.stringify(outfits));
                displaySavedOutfits();
            }
        });
        savedOutfits.appendChild(outfitElement);
    });
}

function addOutfitToCalendar(outfit) {
    const date = prompt('Enter date for this outfit (MM-DD-YYYY):');
    if (date) {
        const [month, day, year] = date.split('-');
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const calendarEl = document.getElementById('calendar');
        const calendar = calendarEl._calendar;
        calendar.addEvent({
            title: outfit.name,
            start: formattedDate,
            allDay: true
        });
        saveCalendarEvents(calendar);
    }
}

function saveCalendarEvents(calendar) {
    const events = calendar.getEvents().map(event => ({
        title: event.title,
        start: event.startStr,
        allDay: event.allDay,
        extendedProps: event.extendedProps
    }));
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function setupAIOutfits() {
    const aiOutfitsGrid = document.getElementById('ai-outfits-grid');
    aiOutfitsGrid.innerHTML = ''; // Clear existing outfits
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    
    const shirts = items.filter(item => item.category === 'shirt');
    const pants = items.filter(item => item.category === 'pant');
    const shoes = items.filter(item => item.category === 'shoes');
    const accessories = items.filter(item => item.category === 'accessories');

    for (let i = 0; i < 5; i++) { // Generate 5 outfits
        const outfit = {
            shirt: shirts[Math.floor(Math.random() * shirts.length)],
            pant: pants[Math.floor(Math.random() * pants.length)],
            shoes: shoes[Math.floor(Math.random() * shoes.length)],
            accessory: accessories[Math.floor(Math.random() * accessories.length)]
        };

        if (outfit.shirt && outfit.pant && outfit.shoes && outfit.accessory) {
            const outfitElement = createOutfitElement(outfit);
            aiOutfitsGrid.appendChild(outfitElement);
        }
    }

    if (aiOutfitsGrid.children.length === 0) {
        aiOutfitsGrid.innerHTML = '<p>Not enough items to generate outfits. Please add more items to your closet.</p>';
    }
}

function createOutfitElement(outfit) {
    const outfitElement = document.createElement('div');
    outfitElement.classList.add('ai-outfit');
    outfitElement.innerHTML = `
        <img src="${outfit.shirt.imageSrc}" alt="Shirt">
        <img src="${outfit.pant.imageSrc}" alt="Pants">
        <img src="${outfit.shoes.imageSrc}" alt="Shoes">
        <img src="${outfit.accessory.imageSrc}" alt="Accessory">
        <button class="save-to-calendar">Save to Calendar</button>
    `;
    outfitElement.querySelector('.save-to-calendar').addEventListener('click', () => saveOutfitToCalendar(outfit));
    return outfitElement;
}

function saveOutfitToCalendar(outfit) {
    const date = prompt('Enter date for this outfit (MM-DD-YYYY):');
    if (date) {
        const [month, day, year] = date.split('-');
        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const outfitName = prompt('Enter a name for this outfit:');
        if (outfitName) {
            const calendarEl = document.getElementById('calendar');
            if (calendarEl && calendarEl._calendar) {
                const calendar = calendarEl._calendar;
                const event = {
                    title: outfitName,
                    start: formattedDate,
                    allDay: true,
                    extendedProps: {
                        outfit: outfit
                    }
                };
                
                calendar.addEvent(event);
                saveCalendarEvents(calendar);
                alert('Outfit added to calendar!');
            } else {
                console.error('Calendar not initialized');
                initializeCalendar(); // Try to initialize the calendar
                alert('Please try adding the outfit again. The calendar has been reinitialized.');
            }
        }
    }
}

function saveCalendarEvents(calendar) {
    const events = calendar.getEvents().map(event => ({
        title: event.title,
        start: event.startStr,
        allDay: event.allDay,
        extendedProps: event.extendedProps
    }));
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

// Modify the existing initializeCalendar function to handle outfit events
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl && !calendarEl._calendar) {
        console.log('Initializing calendar'); // Debug log
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            height: 'auto',
            editable: true, // Enable drag and drop
            events: JSON.parse(localStorage.getItem('calendarEvents') || '[]'),
            eventContent: function(arg) {
                if (arg.event.extendedProps.outfit) {
                    return {
                        html: `
                            <div class="fc-content">
                                <span class="fc-title">${arg.event.title}</span>
                                <div class="outfit-preview">
                                    <img src="${arg.event.extendedProps.outfit.shirt.imageSrc}" alt="Shirt" style="width: 20px; height: 20px;">
                                    <img src="${arg.event.extendedProps.outfit.pant.imageSrc}" alt="Pants" style="width: 20px; height: 20px;">
                                    <img src="${arg.event.extendedProps.outfit.shoes.imageSrc}" alt="Shoes" style="width: 20px; height: 20px;">
                                    <img src="${arg.event.extendedProps.outfit.accessory.imageSrc}" alt="Accessory" style="width: 20px; height: 20px;">
                                </div>
                            </div>
                        `
                    };
                }
            },
            eventClick: function(info) {
                if (confirm(`Delete outfit "${info.event.title}" from ${info.event.startStr}?`)) {
                    info.event.remove();
                    saveCalendarEvents(calendar);
                }
            },
            eventDrop: function(info) {
                // This function is called when an event is dragged and dropped
                console.log('Event dropped:', info.event.title, 'to', info.event.startStr);
                saveCalendarEvents(calendar);
            },
            eventDragStop: function(info) {
                // This function is called when dragging stops (whether dropped on a valid date or not)
                console.log('Drag stopped:', info.event.title);
            }
        });
        calendar.render();
        calendarEl._calendar = calendar;
    } else if (calendarEl && calendarEl._calendar) {
        console.log('Calendar already initialized, re-rendering'); // Debug log
        calendarEl._calendar.render();
    } else {
        console.error('Calendar element not found');
    }
}

function populateAvailableItems() {
    const availableItems = document.getElementById('available-items');
    if (availableItems) {
        availableItems.innerHTML = '';
        const items = JSON.parse(localStorage.getItem('items') || '[]');
        items.forEach(item => {
            const itemElement = createItemElement(item);
            itemElement.draggable = true;
            itemElement.addEventListener('dragstart', handleDragStart);
            availableItems.appendChild(itemElement);
        });
    } else {
        console.error('Available items element not found');
    }
}

