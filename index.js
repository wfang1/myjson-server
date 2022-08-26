const classSelection = (() => {
    const baseURL = 'http://localhost:4232';
    const path = 'courseList';

    // function to get the courses
    const getCourses = () => 
        fetch([baseURL, path].join('/')).then((response) => response.json());

    // no need to add or delete as we are only moving objects

    return {getCourses};
})();

// VIEW
const View = (() => {
    // DOM objects we will modify
    const domStr = {
        availableClasses: '#available',
        selectedClasses: '#selected',
        evenBox: 'even-box',
        oddBox: 'odd-box'
    }

    //rendering funciton
    const render = (ele, tmp) => {
        ele.innerHTML = tmp;
    }

    // creating string to be inputted
    const createTmp = (arr) => {
        let tmp = ''; // empty html string
        let index = 0; // coloring index
        
        arr.forEach((course) => {
            let required = '';
            let classBox = '';
            if(course.required === true)
                required = 'Compulsory';
            else
                required = 'Elective';
            if(index % 2 === 0) // even 
                classBox = domStr.evenBox;
            else // odd
                classBox = domStr.oddBox;

            tmp += `
            <div class="${classBox}">
                <p>${course.courseName}</p>
                <p>Course Type: ${required}</p>
                <p>Course Credit: ${course.credit}</p>
            </div>
            `;
            ++index;
        });
        return tmp;
    }

    return {
        domStr,
        render,
        createTmp
    };
})(); // passes none

// MODEL
const Model = ((classSelection, view) => {
    class Course {
        constructor(id, name, required, credit) {
            this.id = id;
            this.name = name;
            this.required = required;
            this.credit = credit;
            this.selected = false;
        }
    }

    class State {
        #availableList = [];
        #selectedList = [];

        // getters and setters
        get availableList() {
            return this.#availableList;
        }
        set availableList(newList) {
            this.#availableList = [...newList];

            const availableClasses = document.querySelector(view.domStr.availableClasses);
            const tmp = view.createTmp(this.#availableList);
            view.render(availableClasses, tmp);
        }
        get selectedList() {
            return this.#selectedList;
        }
        set selectedList(newList) {
            this.#selectedList = [...newList];

            const selectedClasses = document.querySelector(view.domstr.selectedClasses);
            const tmp = view.createTmp(this.#selectedList);
            view.render(selectedClasses, tmp);
        }
    }
    // i'm leaving this as an object if we need to add future html functions
    const {getCourses} = classSelection;

    return {
        getCourses,
        Course,
        State
    }
})(classSelection, View);

// CONTROLLER
const Controller = ((model, view) => {
    const state = new model.State();

    // initializes all the 'buttons' to be able to be clicked
    const clickClass = () => {
        const availableContainer = document.querySelector(view.domStr.availableClasses);
        availableContainer.addEventListener('click', (event) => {
            // this is sloppy but i can't think of how to clean it up for now
            console.log(event.target.className);
            //event.target.className = 'odd-box-selected';
        }, true);
    }

    // initialization
    const init = () => {
        model.getCourses().then((courses) => {
            state.availableList = [...courses];
        });
    }

    const bootstrap = () => {
        init();
        clickClass();
    }

    return {
        bootstrap,
    }
})(Model, View);

Controller.bootstrap();

// Note on VMC -
// View handles visual, such as the element lines themselves
// Model handles the data structure and calls view
// Controller is the only method allowed to the user to control the system