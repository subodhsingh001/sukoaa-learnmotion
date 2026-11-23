export type Question = {question:string;options:string[];answer:number;explanation:string};
export const atomicQuiz:Question[]=[
{question:"Which particle has a positive charge?",options:["Electron","Proton","Neutron"],answer:1,explanation:"Protons have a positive charge and are found in the nucleus."},
{question:"Where is most of an atom's mass?",options:["Nucleus","Electron cloud","Outside the atom"],answer:0,explanation:"Protons and neutrons account for almost all atomic mass."},
{question:"What changes when you select carbon instead of helium?",options:["Number of protons","Gravity","Electron charge"],answer:0,explanation:"The element is defined by its proton count."}];
export const geometryQuiz:Question[]=[
{question:"How many faces does a cube have?",options:["4","6","8"],answer:1,explanation:"A cube has six square faces."},
{question:"Which shape has no edges or vertices?",options:["Cube","Cylinder","Sphere"],answer:2,explanation:"A sphere has one continuous curved surface."},
{question:"What is the volume of a cube with side 3 units?",options:["9","18","27"],answer:2,explanation:"Cube volume = side cubed = 3 × 3 × 3 = 27 cubic units."}];

export const humanBodyQuiz:Question[]=[
{question:"Which organ pumps blood around the body?",options:["Lungs","Heart","Stomach"],answer:1,explanation:"The heart pumps blood through the circulatory system."},
{question:"Which organs exchange oxygen and carbon dioxide?",options:["Lungs","Kidneys","Intestines"],answer:0,explanation:"The lungs exchange gases between air and blood."},
{question:"Which organ coordinates memory and movement?",options:["Brain","Stomach","Heart"],answer:0,explanation:"The brain coordinates nervous-system activity."}];
export const photosynthesisQuiz:Question[]=[
{question:"Which gas do plants absorb for photosynthesis?",options:["Oxygen","Carbon dioxide","Nitrogen"],answer:1,explanation:"Plants take in carbon dioxide to make sugars."},
{question:"Which substance is released during photosynthesis?",options:["Oxygen","Salt","Carbon dioxide"],answer:0,explanation:"Photosynthesis releases oxygen as a by-product."},
{question:"If water is low but light and CO2 are high, what limits photosynthesis?",options:["Water","Light","Neither"],answer:0,explanation:"The least available essential input limits the rate in this simplified model."}];
