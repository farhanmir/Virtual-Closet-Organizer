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
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                if (section === sectionToShow) {
                    element.classList.remove('hidden');
                    if (section === 'items-section') {
                        showItemsSection();
                    }
                } else {
                    element.classList.add('hidden');
                }
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

document.getElementById('submit-item').addEventListener('click', function() {
    const fileInput = document.getElementById('file-input');
    const description = document.getElementById('description').value;
    const color = document.getElementById('color').value;
    const category = document.getElementById('category').value;
    
    if (fileInput.files.length > 0 && description && color) {
        const reader = new FileReader();
        reader.onload = function(e) {
            addItemToGrid(e.target.result, description, category, color);
            resetUploadForm();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert('Please provide an image, description, and color.');
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
    const itemsGrid = document.getElementById('items-grid');
    const item = document.createElement('div');
    item.innerHTML = `
        <img src="${imageSrc}" alt="${description}">
        <p>${description}</p>
        <p>${category}</p>
        <p>Color: <span style="display:inline-block; width:20px; height:20px; background-color:${color};"></span> ${color}</p>
        <button class="delete-item">Delete</button>
    `;
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    
    // Add delete functionality
    item.querySelector('.delete-item').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this item?')) {
            item.remove();
            // Remove from local storage
            const items = JSON.parse(localStorage.getItem('items') || '[]');
            const updatedItems = items.filter(i => i.description !== description);
            localStorage.setItem('items', JSON.stringify(updatedItems));
        }
    });
    
    // Save to local storage
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.push({ imageSrc, description, category, color });
    localStorage.setItem('items', JSON.stringify(items));
    
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
        end: event.endStr,
        allDay: event.allDay
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
        <button class="save-outfit">Save Outfit</button>
    `;
    outfitElement.querySelector('.save-outfit').addEventListener('click', () => saveAIOutfit(outfit));
    return outfitElement;
}

function saveAIOutfit(outfit) {
    const outfitName = prompt('Enter a name for this outfit:');
    if (outfitName) {
        const outfits = JSON.parse(localStorage.getItem('outfits') || '[]');
        outfits.push({
            name: outfitName,
            items: [outfit.shirt, outfit.pant, outfit.shoes, outfit.accessory]
        });
        localStorage.setItem('outfits', JSON.stringify(outfits));
        alert('Outfit saved successfully!');
    }
}

// Modify the existing addItemToGrid function to include background removal
function addItemToGrid(imageSrc, description, category, color) {
    const itemsGrid = document.getElementById('items-grid');
    const item = document.createElement('div');
    item.innerHTML = `
        <img src="${imageSrc}" alt="${description}">
        <p>${description}</p>
        <p>${category}</p>
        <p>Color: <span style="display:inline-block; width:20px; height:20px; background-color:${color};"></span> ${color}</p>
        <button class="delete-item">Delete</button>
    `;
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    
    // Add delete functionality
    item.querySelector('.delete-item').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this item?')) {
            item.remove();
            // Remove from local storage
            const items = JSON.parse(localStorage.getItem('items') || '[]');
            const updatedItems = items.filter(i => i.description !== description);
            localStorage.setItem('items', JSON.stringify(updatedItems));
        }
    });
    
    // Save to local storage
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.push({ imageSrc, description, category, color });
    localStorage.setItem('items', JSON.stringify(items));
    
    itemsGrid.appendChild(item);
}

// Placeholder function for background removal (you'll need to implement this)
function removeBackground(imageSrc) {
    // Implement background removal logic here
    // For now, we'll just return the original image
    return imageSrc;
}

let bodyPixModel;

async function loadBodyPixModel() {
    bodyPixModel = await bodyPix.load();
}

document.addEventListener('DOMContentLoaded', async function() {
    // ... existing code ...
    await loadBodyPixModel();
    // ... existing code ...
});

document.getElementById('remove-background').addEventListener('click', async function() {
    const fileInput = document.getElementById('file-input');
    if (fileInput.files.length > 0) {
        const img = await createImageBitmap(fileInput.files[0]);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Simple background removal (replace with white)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (r > 240 && g > 240 && b > 240) {
                data[i + 3] = 0; // Set alpha to 0 for white pixels
            }
        }
        ctx.putImageData(imageData, 0, 0);

        const dataURL = canvas.toDataURL('image/png');
        const previewImg = document.createElement('img');
        previewImg.src = dataURL;
        previewImg.style.maxWidth = '300px';
        previewImg.style.maxHeight = '300px';
        const previewContainer = document.getElementById('preview-container') || document.createElement('div');
        previewContainer.id = 'preview-container';
        previewContainer.innerHTML = '';
        previewContainer.appendChild(previewImg);
        fileInput.parentNode.insertBefore(previewContainer, fileInput.nextSibling);
    } else {
        alert('Please select an image first.');
    }
});

document.getElementById('create-outfit').addEventListener('click', function() {
    const packingItemsDiv = document.getElementById('packing-items');
    packingItemsDiv.innerHTML = ''; // Clear existing items
    const items = document.querySelectorAll('#items-grid div');
    items.forEach(item => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const label = document.createElement('label');
        label.innerHTML = item.querySelector('img').outerHTML;
        packingItemsDiv.appendChild(checkbox);
        packingItemsDiv.appendChild(label);
    });
});

function updateItemsSection() {
    const itemsGrid = document.getElementById('items-grid');
    const emptyState = document.querySelector('.empty-state');
    const items = JSON.parse(localStorage.getItem('items') || '[]');

    if (items.length === 0) {
        itemsGrid.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        itemsGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');
        displayItems();
    }
}

function displayItems() {
    const itemsGrid = document.getElementById('items-grid');
    itemsGrid.innerHTML = '';
    const items = JSON.parse(localStorage.getItem('items') || '[]');
    items.forEach(item => addItemToGrid(item.imageSrc, item.description, item.category, item.color));
}

// Call this function when the items section is shown
function showItemsSection() {
    updateItemsSection();
}

// Add event listener for the "Add Your First Item" button
document.getElementById('add-first-item').addEventListener('click', function() {
    toggleSections('upload-section');
});
