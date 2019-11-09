var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as moment from 'moment';
import components from './components';
import { resizeElementToNodes, loadFontsOfComponents } from './utils';
figma.showUI(__html__, {
    height: 340,
    width: 380
});
figma.ui.onmessage = msg => {
    //check if message is correct, otherwise cancel
    if (msg.type === 'generate') {
        generate(msg.data).then((message) => {
            figma.notify(message);
        });
    }
    else if (msg.type === 'create') {
        create().then((message) => {
            figma.notify(message);
        });
    }
    else if (msg.type === 'cancel') {
        figma.closePlugin();
    }
    else {
        figma.closePlugin("Message not recognised 🥳");
    }
};
//Make components
function create() {
    return __awaiter(this, void 0, void 0, function* () {
        const componentsExist = figma.currentPage.findAll(n => (n.name.includes('cal#')));
        if (componentsExist.length > 0)
            return "'cal#' components exist, you can start building.";
        //Create Background
        const backgroundFrame = figma.createFrame();
        backgroundFrame.name = 'Calendar Components';
        backgroundFrame.backgrounds = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        backgroundFrame.x = -100;
        backgroundFrame.y = -300;
        for (const key in components) {
            const component = components[key];
            const newComponent = figma.createComponent();
            newComponent.name = component.name;
            newComponent.x = component.x;
            newComponent.y = component.y;
            for (const key in component.layers) {
                let node;
                const layer = component.layers[key];
                if (layer.set.type === 'RECTANGLE')
                    node = figma.createRectangle();
                if (layer.set.type === 'TEXT')
                    node = figma.createText();
                for (const key in layer) {
                    if (key == 'fontName')
                        yield figma.loadFontAsync(layer[key]);
                    if (key != 'set')
                        node[key] = layer[key];
                }
                node.resizeWithoutConstraints(layer.set.width, layer.set.height);
                newComponent.appendChild(node);
            }
            resizeElementToNodes(newComponent, newComponent.children);
            backgroundFrame.resizeWithoutConstraints(1680, 840);
        }
        const selection = figma.currentPage.findAll(n => (n.name.includes('cal#')));
        return "Created. ⚡️";
    });
}
//Populate Dates
function generate(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const components = figma.currentPage.findAll(n => (n.name.includes('cal#')));
        if (!components)
            return "Make or go to page with calendar components first. 🙄";
        for (const component of components) {
            if (component.type !== 'COMPONENT')
                return "One of your calendar elements is not a component";
        }
        //load all used fonts
        const missingFonts = yield loadFontsOfComponents(components);
        if (missingFonts)
            return missingFonts;
        //The building blocks
        const mondayComponent = figma.currentPage.findOne(n => n.name === 'cal#Monday');
        const dayComponent = figma.currentPage.findOne(n => n.name === 'cal#Day');
        const weekendComponent = figma.currentPage.findOne(n => n.name === 'cal#Weekend');
        const daynameComponent = figma.currentPage.findOne(n => n.name === 'cal#Dayname');
        const daynameWeekendComponent = figma.currentPage.findOne(n => n.name === 'cal#DaynameWeekend');
        const weekStructure = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Sat', 'Sun'];
        const calStructure = ['Monday', 'Day', 'Day', 'Day', 'Day', 'Weekend', 'Weekend'];
        //Date Variables
        const currentDateStart = moment(message.date).day(1);
        let monthSwitch = false;
        const anchorX = 2000;
        const anchorY = -200;
        //Make Header
        let currentX = anchorX;
        for (let i = 0; i < weekStructure.length; i++) {
            let node;
            if (i >= 0 && i <= 4)
                node = daynameComponent.createInstance();
            else
                node = daynameWeekendComponent.createInstance();
            node.x = currentX;
            node.y = anchorY;
            //Change text
            const text = node.findOne(n => n.name === '#dayname' && n.type == 'TEXT');
            if (text)
                text.characters = weekStructure[i];
            currentX += node.width;
        }
        //Make Calendar
        let currentY = anchorY + daynameComponent.height;
        currentX = anchorX; //reset x
        for (let i = 0; i <= message.weeks; i++) {
            for (let j = 0; j < calStructure.length; j++) {
                let node;
                const day = calStructure[j];
                if (day == 'Monday')
                    node = mondayComponent.createInstance();
                else if (day == 'Day')
                    node = dayComponent.createInstance();
                else if (day == 'Weekend')
                    node = weekendComponent.createInstance();
                node.x = currentX;
                node.y = currentY;
                const dayTextNode = node.findOne(n => n.name === '#day' && n.type == 'TEXT');
                const weekTextNode = node.findOne(n => n.name === '#week' && n.type == 'TEXT');
                const monthTextNode = node.findOne(n => n.name === '#month' && n.type == 'TEXT');
                const backgroundNode = node.findOne(n => n.name === "#background" && n.type === "RECTANGLE");
                const curDate = currentDateStart.clone().add((i * 7) + j, 'days');
                const curDayName = curDate.format('DD');
                const curMonthName = curDate.format('MMMM');
                if (dayTextNode)
                    dayTextNode.characters = curDayName;
                if (weekTextNode)
                    weekTextNode.characters = String(i);
                if (monthTextNode) {
                    if (curDate.date() === 1)
                        monthTextNode.characters = curMonthName; //Only add month at start of every month
                    else if ((curDate.date() === 2 || curDate.date() === 3) && curDate.day() === 1)
                        monthTextNode.characters = curMonthName; //If it was in weekend, still add on Monday
                    else
                        monthTextNode.characters = "";
                    if (i === 0 && j === 0)
                        monthTextNode.characters = curMonthName; //Always add month on first box anyway
                }
                //Alternate month for colours
                if (curDate.date() === 1)
                    monthSwitch = !monthSwitch;
                if (backgroundNode) {
                    if (monthSwitch)
                        backgroundNode.opacity = 0.5;
                    else
                        backgroundNode.opacity = 0.25;
                }
                currentX += node.width;
            }
            currentX = anchorX; //reset x
            currentY += mondayComponent.height;
        }
        return "Done. ⚡️";
    });
}
