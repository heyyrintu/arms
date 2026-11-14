export const intakeTransitions={
 employer:{received:['contacted','closed'],contacted:['qualified','closed'],qualified:['proposal','closed'],proposal:['won','closed'],won:[],closed:[]},
 talent:{received:['reviewing','withdrawn'],reviewing:['withdrawn'],withdrawn:[]},
 application:{received:['reviewing','withdrawn','closed'],reviewing:['shortlisted','not_selected','withdrawn','closed'],shortlisted:['interview','not_selected','withdrawn','closed'],interview:['hired','not_selected','withdrawn','closed'],hired:[],not_selected:[],withdrawn:[],closed:[]},
};
export const intakeLabels={employer:'Employer enquiries',talent:'Career profiles',application:'Applications'};
export const statusLabels={received:'Received',reviewing:'Reviewing',contacted:'Contacted',qualified:'Qualified',proposal:'Proposal',won:'Won',closed:'Closed',shortlisted:'Shortlisted',interview:'Interview',hired:'Hired',not_selected:'Not selected',withdrawn:'Withdrawn'};
