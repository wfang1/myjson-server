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
        oddBox: 'odd-box',
        totalCredits: '#total-credits'
    }

    // strings for messages
    const winMessages = {
        tooManyCredits: "You can only choose up to 18 credits in one semester",
        selectMessage: (totalCredits) => {
            return "You have chosen " + totalCredits + " credits for this semester. You cannot change once you submit. Do you want to confirm?";
        }
    }

    //rendering function
    const render = (ele, tmp) => {
        ele.innerHTML = tmp;
    }

    // creating string to be inputted
    const createTmp = (arr, clickable) => {
        let tmp = ''; // empty html string
        let index = 0; // coloring index
        let clickFunction = '';
        if(clickable === true) {
            clickFunction = 'onclick="Controller.clickClass(this)"';
        }
        
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
            <div class="${classBox}" ${clickFunction} id="${course.courseId}">
                <p>${course.courseName}</p>
                <p>Course Type: ${required}</p>
                <p>Course Credit: ${course.credit}</p>
            </div>
            `;
            ++index;
        });
        return tmp;
    }

    // this function returns the innerhtml for handling display of credits
    const modifyCredits = (num) => {
        return "Total Credits: " + num;
    }

    return {
        domStr,
        winMessages,
        render,
        createTmp,
        modifyCredits
    };
})(); // passes none

// MODEL
const Model = ((classSelection, view) => {
    class State {
        #availableList = [];
        #selectedList = [];
        #creditCount = 0;
        #prospectList = []; // list of ids that are selected

        // getters and setters
        get availableList() {
            return this.#availableList;
        }
        set availableList(newList) {
            this.#availableList = [...newList];

            const availableClasses = document.querySelector(view.domStr.availableClasses);
            const tmp = view.createTmp(this.#availableList, true);
            view.render(availableClasses, tmp);
        }
        get selectedList() {
            return this.#selectedList;
        }
        set selectedList(newList) {
            this.#selectedList = [...newList];

            const selectedClasses = document.querySelector(view.domStr.selectedClasses);
            const tmp = view.createTmp(this.#selectedList, false);
            view.render(selectedClasses, tmp);
        }
        get creditCount() {
            return this.#creditCount;
        }

        // special modifiers and getters
        addCredits(id) {
            // get course and id
            let course = this.getCourseFromId(id);
            let num = course.credit;

            // error handling
            if(this.#creditCount + num > 18) {
                alert(view.winMessages.tooManyCredits);
                return false;
            }

            // change credit display
            this.#creditCount += num;
            const creditDisplayer = document.querySelector(view.domStr.totalCredits);
            const tmp = view.modifyCredits(this.#creditCount);
            view.render(creditDisplayer, tmp);

            // add id to the array
            this.#prospectList.push(id);

            return true;
        }
        subtractCredits(id) {
            // get course and id
            let course = this.getCourseFromId(id);
            let num = course.credit;

            // change credit display
            this.#creditCount -= num;
            const creditDisplayer = document.querySelector(view.domStr.totalCredits);
            const tmp = view.modifyCredits(this.#creditCount);
            view.render(creditDisplayer, tmp);

            // remove id from array
            for(let i = 0; i < this.#prospectList.length; ++i) {
                if(this.#prospectList[i] === id) {
                    this.#prospectList.splice(i, 1);
                    break;
                }
            }
        }
        getCourseFromId(id) {
            for(let course of this.#availableList) {
                if(course.courseId == id) { // not === here is necessary; otherwise it won't read
                    return course;
                }
            }

            console.log("Course id " + id + " wasn't able to be found!");
            return null;
        }
        moveCourses() {
            // check classes of available with id and add them
            let newSList = [];
            let newAList = [...this.#availableList];
            for(let id of this.#prospectList) {
                newSList.push(this.getCourseFromId(id));
                this.removeCourse(id, newAList);
            }

            return {
                newSList,
                newAList
            }
        }
        removeCourse(id, array) {
            for(let i = 0; i < array.length; ++i) {
                if(array[i].courseId == id) {
                    array.splice(i, 1);
                    return;
                }
            }

            console.log('Course id: ' + id + ' removal unsuccessful!');
        }
    }
    // i'm leaving this as an object if we need to add future html functions
    const {getCourses} = classSelection;

    return {
        getCourses,
        State
    }
})(classSelection, View);

// CONTROLLER
const Controller = ((model, view) => {
    const state = new model.State();

    // class used for handling clicking the class
    const clickClass = (element) => {
        // I wish I knew a cleaner way of doing this but I don't
        let isSelected = false;

        if(element.className === 'even-box') {
            element.className = 'even-box-selected';
            isSelected = true;
        }
        else if(element.className === 'odd-box') {
            element.className = 'odd-box-selected';
            isSelected = true;
        }
        else if(element.className === 'even-box-selected')
            element.className = 'even-box';
        else if(element.className === 'odd-box-selected')
            element.className = 'odd-box';

        // if it's selected, then we add, otherwise subtract
        if(isSelected === true) {
            if(state.addCredits(element.id) === false) {
                // reverse colors if we have too many credits
                // copy paste is bad but this is actually more efficient (by a little)
                if(element.className === 'even-box-selected')
                    element.className = 'even-box';
                else if(element.className === 'odd-box-selected')
                    element.className = 'odd-box';
            }
        } else {
            state.subtractCredits(element.id);
        }
    }

    // handles clicking on select
    const clickSelect = (element) => {
        // pop up window
        let result = confirm(view.winMessages.selectMessage(state.creditCount));
        if(result === true) { // handle moving objects
            // run through the ids in prospect move them over to selected
            let courseLists = state.moveCourses();
            state.availableList = [...courseLists.newAList];
            state.selectedList = [...courseLists.newSList];

            // disable the button
            element.disabled = true;
        }
        // don't do anything otherwise
    }

    // initialization
    const init = () => {
        model.getCourses().then((courses) => {
            state.availableList = [...courses];
        });
    }

    const bootstrap = () => {
        init();
    }

    return {
        bootstrap,
        clickClass,
        clickSelect
    }
})(Model, View);

Controller.bootstrap();

// Note on VMC -
// View handles visual, such as the element lines themselves
// Model handles the data structure and calls view
// Controller is the only method allowed to the user to control the system