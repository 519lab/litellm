(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,618566,(e,t,a)=>{t.exports=e.r(976562)},841947,e=>{"use strict";let t=(0,e.i(475254).default)("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);e.s(["default",0,t])},37727,e=>{"use strict";var t=e.i(841947);e.s(["X",()=>t.default])},409797,e=>{"use strict";var t=e.i(631171);e.s(["ChevronDownIcon",()=>t.default])},233565,e=>{"use strict";var t=e.i(246349);e.s(["ChevronRightIcon",()=>t.default])},54943,e=>{"use strict";let t=(0,e.i(475254).default)("search",[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]]);e.s(["default",0,t])},555436,e=>{"use strict";var t=e.i(54943);e.s(["Search",()=>t.default])},172410,e=>{"use strict";var t=e.i(271645);let a=t.createContext(void 0),i={disableStyleElements:!1};e.s(["useCSPContext",0,function(){return t.useContext(a)??i}])},550896,e=>{"use strict";var t=e.i(201675);e.s(["SCROLL_EDGE_TOLERANCE_PX",0,1,"getMaxScrollOffset",0,function(e,t){return Math.max(0,e-t)},"normalizeScrollOffset",0,function(e,a){if(a<=0)return 0;let i=(0,t.clamp)(e,0,a),r=a-i,o=i<=1,n=r<=1;return o&&n?i<=r?0:a:o?0:n?a:i}])},60837,e=>{"use strict";var t=e.i(843476);let a="base-ui-disable-scrollbar";e.s(["styleDisableScrollbar",0,{className:a,getElement:e=>(0,t.jsx)("style",{nonce:e,href:a,precedence:"base-ui:low",children:`.${a}{scrollbar-width:none}.${a}::-webkit-scrollbar{display:none}`})}])},652225,e=>{"use strict";var t=e.i(271645),a=e.i(552245);let i=t.forwardRef(function(e,t){let{className:i,render:r,orientation:o="horizontal",style:n,...s}=e;return(0,a.useRenderElement)("div",e,{state:{orientation:o},ref:t,props:[{role:"separator","aria-orientation":o},s]})});e.s(["Separator",0,i])},344523,e=>{"use strict";let t=(0,e.i(475254).default)("chevrons-up-down",[["path",{d:"m7 15 5 5 5-5",key:"1hf1tw"}],["path",{d:"m7 9 5-5 5 5",key:"sgt6xg"}]]);e.s(["ChevronsUpDown",0,t],344523)},951437,e=>{"use strict";var t=e.i(271645);e.s(["useControlled",0,function({controlled:e,default:a,name:i,state:r="value"}){let{current:o}=t.useRef(void 0!==e),[n,s]=t.useState(a),l=t.useCallback(e=>{o||s(e)},[]);return[o?e:n,l]}])},33383,e=>{"use strict";var t=e.i(271645),a=e.i(108868),i=e.i(145484),r=e.i(146376);e.s(["useAnchoredPopupScrollLock",0,function(e,o,n,s){let[l,d]=t.useState(!1);(0,r.useIsoLayoutEffect)(()=>{if(!e||!o||null==n)return void d(!1);let t=(0,a.ownerDocument)(n).documentElement.clientWidth,i=n.offsetWidth;d(t>0&&i>0&&i>=t-20)},[e,o,n]),(0,i.useScrollLock)(e&&(!o||l),s)}])},96533,e=>{"use strict";var t=e.i(733332),a=e.i(271645);let i=a.createContext(void 0);e.s(["useToolbarRootContext",0,function(e){let r=a.useContext(i);if(void 0===r&&!e)throw Error((0,t.default)(69));return r}])},346570,e=>{"use strict";var t=e.i(271645),a=e.i(174080),i=e.i(647554),r=e.i(383976),o=e.i(675606),n=e.i(56434);e.s(["useTriggerFocusGuards",0,function(e,s){let l=t.useRef(null);return{preFocusGuardRef:l,handlePreFocusGuardFocus:function(t){a.flushSync(()=>{e.setOpen(!1,(0,o.createChangeEventDetails)(n.REASONS.focusOut,t.nativeEvent,t.currentTarget))});let i=(0,r.getTabbableBeforeElement)(l.current);i?.focus()},handleFocusTargetFocus:function(t){let l=e.select("positionerElement");if(l&&(0,r.isOutsideEvent)(t,l))e.context.beforeContentFocusGuardRef.current?.focus();else{a.flushSync(()=>{e.setOpen(!1,(0,o.createChangeEventDetails)(n.REASONS.focusOut,t.nativeEvent,t.currentTarget))});let d=(0,r.getTabbableAfterElement)(e.context.triggerFocusTargetRef.current||s.current);for(;null!==d&&(0,i.contains)(l,d);){let e=d;if((d=(0,r.getNextTabbable)(d))===e)break}d?.focus()}}}}])},678745,e=>{"use strict";let t=(0,e.i(475254).default)("check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);e.s(["default",0,t])},643531,e=>{"use strict";var t=e.i(678745);e.s(["Check",()=>t.default])},631171,e=>{"use strict";let t=(0,e.i(475254).default)("chevron-down",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);e.s(["default",0,t])},664659,e=>{"use strict";var t=e.i(631171);e.s(["ChevronDown",()=>t.default])},469690,875812,381104,e=>{"use strict";e.i(247167);var t,a=e.i(733332),i=e.i(271645),r=e.i(956789);let o=((t={}).disabled="data-disabled",t.valid="data-valid",t.invalid="data-invalid",t.touched="data-touched",t.dirty="data-dirty",t.filled="data-filled",t.focused="data-focused",t),n={badInput:!1,customError:!1,patternMismatch:!1,rangeOverflow:!1,rangeUnderflow:!1,stepMismatch:!1,tooLong:!1,tooShort:!1,typeMismatch:!1,valid:null,valueMissing:!1},s={valid:null,touched:!1,dirty:!1,filled:!1,focused:!1},l={disabled:!1,...s};e.s(["DEFAULT_FIELD_ROOT_STATE",0,l,"DEFAULT_FIELD_STATE_ATTRIBUTES",0,s,"DEFAULT_VALIDITY_STATE",0,n,"fieldValidityMapping",0,{valid:e=>null===e?null:e?{[o.valid]:""}:{[o.invalid]:""}}],875812);let d={invalid:void 0,name:void 0,validityData:{state:n,errors:[],error:"",value:"",initialValue:null},setValidityData:r.NOOP,disabled:void 0,touched:s.touched,setTouched:r.NOOP,dirty:s.dirty,setDirty:r.NOOP,filled:s.filled,setFilled:r.NOOP,focused:s.focused,setFocused:r.NOOP,validate:()=>null,validationMode:"onSubmit",validationDebounceTime:0,shouldValidateOnChange:()=>!1,state:l,markedDirtyRef:{current:!1},registerFieldControl:r.NOOP,validation:{getValidationProps:(e,t=r.EMPTY_OBJECT)=>t,inputRef:{current:null},registerInput:r.NOOP,commit:async()=>{},change:r.NOOP}},u=i.createContext(d);function c(e=!0){let t=i.useContext(u);if(t.setValidityData===r.NOOP&&!e)throw Error((0,a.default)(28));return t}e.s(["DEFAULT_FIELD_ROOT_CONTEXT",0,d,"FieldRootContext",0,u,"useFieldRootContext",0,c],469690);var p=e.i(146376);e.s(["useRegisterFieldControl",0,function(e,t,a,r,o=!0,n){let{registerFieldControl:s}=c(),l=i.useRef(null);l.current||(l.current=Symbol()),(0,p.useIsoLayoutEffect)(()=>{let i=l.current;if(i&&o)return s(i,{controlRef:e,getValue:r,id:t,name:n,value:a}),()=>{s(i,void 0)}},[e,o,r,t,n,s,a])}],381104)},538489,247778,e=>{"use strict";var t=e.i(271645),a=e.i(146376),i=e.i(667865),r=e.i(921374),o=e.i(229315),n=e.i(956789),s=e.i(788015);e.i(247167);let l=t.createContext({controlId:void 0,registerControlId:n.NOOP,labelId:void 0,setLabelId:n.NOOP,messageIds:[],setMessageIds:n.NOOP,getDescriptionProps:e=>e});function d(){return t.useContext(l)}e.s(["useLabelableContext",0,d],247778),e.s(["useLabelableId",0,function(e={}){let{id:l,implicit:u=!1,controlRef:c}=e,{controlId:p,registerControlId:m}=d(),g=(0,s.useBaseUiId)(l),f=u?p:void 0,h=(0,r.useRefWithInit)(()=>Symbol("labelable-control")),_=t.useRef(!1),v=t.useRef(null!=l),b=(0,i.useStableCallback)(()=>{_.current&&m!==n.NOOP&&(_.current=!1,m(h.current,void 0))});return(0,a.useIsoLayoutEffect)(()=>{let e;if(m!==n.NOOP){if(u){let t=c?.current;e=(0,o.isElement)(t)&&null!=t.closest("label")?l??null:f??g}else if(null!=l)v.current=!0,e=l;else{if(!v.current)return void b();e=g}if(void 0===e)return void b();_.current=!0,m(h.current,e)}},[l,c,f,m,u,g,h,b]),t.useEffect(()=>b,[b]),p??g}],538489)},884708,e=>{"use strict";var t=e.i(271645),a=e.i(956789);let i=t.createContext({formRef:{current:{fields:new Map}},errors:{},clearErrors:a.NOOP,validationMode:"onSubmit",submitAttemptedRef:{current:!1}});e.s(["useFormContext",0,function(){return t.useContext(i)}])},590803,e=>{"use strict";e.s(["isElementDisabled",0,function(e){return null==e||e.hasAttribute("disabled")||"true"===e.getAttribute("aria-disabled")}])},545356,e=>{"use strict";var t=e.i(271645);let a=t.createContext({register:()=>{},unregister:()=>{},subscribeMapChange:()=>()=>{},elementsRef:{current:[]},nextIndexRef:{current:0}});e.s(["CompositeListContext",0,a,"useCompositeListContext",0,function(){return t.useContext(a)}])},53687,e=>{"use strict";var t=e.i(271645),a=e.i(921374),i=e.i(667865),r=e.i(146376),o=e.i(545356),n=e.i(843476);function s(){return new Map}function l(){return new Set}function d(e,t){let a=e.compareDocumentPosition(t);return a&Node.DOCUMENT_POSITION_FOLLOWING||a&Node.DOCUMENT_POSITION_CONTAINED_BY?-1:a&Node.DOCUMENT_POSITION_PRECEDING||a&Node.DOCUMENT_POSITION_CONTAINS?1:0}e.s(["CompositeList",0,function(e){let{children:u,elementsRef:c,labelsRef:p,onMapChange:m}=e,g=(0,i.useStableCallback)(m),f=t.useRef(0),h=(0,a.useRefWithInit)(l).current,_=(0,a.useRefWithInit)(s).current,[v,b]=t.useState(0),x=t.useRef(v),y=(0,i.useStableCallback)((e,t)=>{_.set(e,t??null),x.current+=1,b(x.current)}),A=(0,i.useStableCallback)(e=>{_.delete(e),x.current+=1,b(x.current)}),I=t.useMemo(()=>{let e=new Map;return Array.from(_.keys()).filter(e=>e.isConnected).sort(d).forEach((t,a)=>{let i=_.get(t)??{};e.set(t,{...i,index:a})}),e},[_,v]);(0,r.useIsoLayoutEffect)(()=>{if("function"!=typeof MutationObserver||0===I.size)return;let e=new MutationObserver(e=>{let t=new Set,a=e=>t.has(e)?t.delete(e):t.add(e);e.forEach(e=>{e.removedNodes.forEach(a),e.addedNodes.forEach(a)}),0===t.size&&(x.current+=1,b(x.current))});return I.forEach((t,a)=>{a.parentElement&&e.observe(a.parentElement,{childList:!0})}),()=>{e.disconnect()}},[I]),(0,r.useIsoLayoutEffect)(()=>{x.current===v&&(c.current.length!==I.size&&(c.current.length=I.size),p&&p.current.length!==I.size&&(p.current.length=I.size),f.current=I.size),g(I)},[g,I,c,p,v]),(0,r.useIsoLayoutEffect)(()=>()=>{c.current=[]},[c]),(0,r.useIsoLayoutEffect)(()=>()=>{p&&(p.current=[])},[p]);let O=(0,i.useStableCallback)(e=>(h.add(e),()=>{h.delete(e)}));(0,r.useIsoLayoutEffect)(()=>{h.forEach(e=>e(I))},[h,I]);let C=t.useMemo(()=>({register:y,unregister:A,subscribeMapChange:O,elementsRef:c,labelsRef:p,nextIndexRef:f}),[y,A,O,c,p,f]);return(0,n.jsx)(o.CompositeListContext.Provider,{value:C,children:u})}])},673553,e=>{"use strict";var t,a=e.i(271645),i=e.i(146376),r=e.i(545356);let o=((t={})[t.None=0]="None",t[t.GuessFromOrder=1]="GuessFromOrder",t);e.s(["IndexGuessBehavior",0,o,"useCompositeListItem",0,function(e={}){let{label:t,metadata:n,textRef:s,indexGuessBehavior:l,index:d}=e,{register:u,unregister:c,subscribeMapChange:p,elementsRef:m,labelsRef:g,nextIndexRef:f}=(0,r.useCompositeListContext)(),h=a.useRef(-1),[_,v]=a.useState(d??(l===o.GuessFromOrder?()=>{if(-1===h.current){let e=f.current;f.current+=1,h.current=e}return h.current}:-1)),b=a.useRef(null),x=a.useCallback(e=>{if(b.current=e,-1!==_&&null!==e&&(m.current[_]=e,g)){let a=void 0!==t;g.current[_]=a?t:s?.current?.textContent??e.textContent}},[_,m,g,t,s]);return(0,i.useIsoLayoutEffect)(()=>{if(null!=d)return;let e=b.current;if(e)return u(e,n),()=>{c(e)}},[d,u,c,n]),(0,i.useIsoLayoutEffect)(()=>{if(null==d)return p(e=>{let t=b.current?e.get(b.current)?.index:null;null!=t&&v(t)})},[d,p,v]),{ref:x,index:_}}])},395530,e=>{"use strict";var t=e.i(271645),a=e.i(828918),i=e.i(838452),r=e.i(673553);e.s(["useCompositeItem",0,function(e={}){let{highlightItemOnHover:o,highlightedIndex:n,onHighlightedIndexChange:s}=(0,i.useCompositeRootContext)(),{ref:l,index:d}=(0,r.useCompositeListItem)(e),u=n===d,c=t.useRef(null),p=(0,a.useMergedRefs)(l,c);return{compositeProps:{tabIndex:u?0:-1,onFocus(){s(d)},onMouseMove(){let e=c.current;if(!o||!e)return;let t=e.hasAttribute("disabled")||"true"===e.ariaDisabled;u||t||e.focus()}},compositeRef:p,index:d}}])},678784,e=>{"use strict";var t=e.i(678745);e.s(["CheckIcon",()=>t.default])},980376,e=>{"use strict";var t=e.i(843476),a=e.i(353753),i=e.i(115504),r=e.i(519455),o=e.i(995926);function n({...e}){return(0,t.jsx)(a.Dialog.Portal,{"data-slot":"sheet-portal",...e})}function s({className:e,...r}){return(0,t.jsx)(a.Dialog.Backdrop,{"data-slot":"sheet-overlay",className:(0,i.cn)("fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",e),...r})}e.s(["Sheet",0,function({...e}){return(0,t.jsx)(a.Dialog.Root,{"data-slot":"sheet",...e})},"SheetContent",0,function({className:e,children:l,side:d="right",showCloseButton:u=!0,...c}){return(0,t.jsxs)(n,{children:[(0,t.jsx)(s,{}),(0,t.jsxs)(a.Dialog.Popup,{"data-slot":"sheet-content","data-side":d,className:(0,i.cn)("fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",e),...c,children:[l,u&&(0,t.jsxs)(a.Dialog.Close,{"data-slot":"sheet-close",render:(0,t.jsx)(r.Button,{variant:"ghost",className:"absolute top-4 right-4",size:"icon-sm"}),children:[(0,t.jsx)(o.XIcon,{}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})},"SheetDescription",0,function({className:e,...r}){return(0,t.jsx)(a.Dialog.Description,{"data-slot":"sheet-description",className:(0,i.cn)("text-sm text-muted-foreground",e),...r})},"SheetFooter",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"sheet-footer",className:(0,i.cn)("mt-auto flex flex-col gap-2 p-4",e),...a})},"SheetHeader",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"sheet-header",className:(0,i.cn)("flex flex-col gap-1.5 p-4",e),...a})},"SheetTitle",0,function({className:e,...r}){return(0,t.jsx)(a.Dialog.Title,{"data-slot":"sheet-title",className:(0,i.cn)("font-medium text-foreground",e),...r})}])},541071,e=>{"use strict";let t=(0,e.i(475254).default)("ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);e.s(["MoreHorizontal",0,t],541071)},755146,e=>{"use strict";var t=e.i(843476),a=e.i(451512),i=e.i(115504);e.i(233565),e.i(678784),e.s(["DropdownMenu",0,function({...e}){return(0,t.jsx)(a.Menu.Root,{"data-slot":"dropdown-menu",...e})},"DropdownMenuContent",0,function({align:e="start",alignOffset:r=0,side:o="bottom",sideOffset:n=4,className:s,...l}){return(0,t.jsx)(a.Menu.Portal,{children:(0,t.jsx)(a.Menu.Positioner,{className:"isolate z-50 outline-none",align:e,alignOffset:r,side:o,sideOffset:n,children:(0,t.jsx)(a.Menu.Popup,{"data-slot":"dropdown-menu-content",className:(0,i.cn)("z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",s),...l})})})},"DropdownMenuItem",0,function({className:e,inset:r,variant:o="default",...n}){return(0,t.jsx)(a.Menu.Item,{"data-slot":"dropdown-menu-item","data-inset":r,"data-variant":o,className:(0,i.cn)("group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",e),...n})},"DropdownMenuSeparator",0,function({className:e,...r}){return(0,t.jsx)(a.Menu.Separator,{"data-slot":"dropdown-menu-separator",className:(0,i.cn)("-mx-1 my-1 h-px bg-border",e),...r})},"DropdownMenuTrigger",0,function({...e}){return(0,t.jsx)(a.Menu.Trigger,{"data-slot":"dropdown-menu-trigger",...e})}])},332102,e=>{"use strict";let t=(0,e.i(475254).default)("inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);e.s(["Inbox",0,t],332102)},166406,e=>{"use strict";var t=e.i(190144);e.s(["CopyOutlined",()=>t.default])},492030,e=>{"use strict";var t=e.i(121229);e.s(["CheckOutlined",()=>t.default])},447566,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M872 474H286.9l350.2-304c5.6-4.9 2.2-14-5.2-14h-88.5c-3.9 0-7.6 1.4-10.5 3.9L155 487.8a31.96 31.96 0 000 48.3L535.1 866c1.5 1.3 3.3 2 5.2 2h91.5c7.4 0 10.8-9.2 5.2-14L286.9 550H872c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"}}]},name:"arrow-left",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["ArrowLeftOutlined",0,o],447566)},292639,e=>{"use strict";var t=e.i(602869),a=e.i(266027);let i=(0,e.i(243652).createQueryKeys)("uiSettings");e.s(["useUISettings",0,()=>(0,a.useQuery)({queryKey:i.list({}),queryFn:async()=>await (0,t.getUiSettings)(),staleTime:36e5,gcTime:36e5})])},829672,836938,310730,e=>{"use strict";e.i(247167);var t=e.i(271645),a=e.i(343794),i=e.i(914949),r=e.i(404948);let o=e=>e?"function"==typeof e?e():e:null;e.s(["getRenderPropValue",0,o],836938);var n=e.i(613541),s=e.i(763731),l=e.i(242064),d=e.i(491816);e.i(793154);var u=e.i(880476),c=e.i(183293),p=e.i(717356),m=e.i(320560),g=e.i(307358),f=e.i(246422),h=e.i(838378),_=e.i(617933);let v=(0,f.genStyleHooks)("Popover",e=>{let{colorBgElevated:t,colorText:a}=e,i=(0,h.mergeToken)(e,{popoverBg:t,popoverColor:a});return[(e=>{let{componentCls:t,popoverColor:a,titleMinWidth:i,fontWeightStrong:r,innerPadding:o,boxShadowSecondary:n,colorTextHeading:s,borderRadiusLG:l,zIndexPopup:d,titleMarginBottom:u,colorBgElevated:p,popoverBg:g,titleBorderBottom:f,innerContentPadding:h,titlePadding:_}=e;return[{[t]:Object.assign(Object.assign({},(0,c.resetComponent)(e)),{position:"absolute",top:0,left:{_skip_check_:!0,value:0},zIndex:d,fontWeight:"normal",whiteSpace:"normal",textAlign:"start",cursor:"auto",userSelect:"text","--valid-offset-x":"var(--arrow-offset-horizontal, var(--arrow-x))",transformOrigin:"var(--valid-offset-x, 50%) var(--arrow-y, 50%)","--antd-arrow-background-color":p,width:"max-content",maxWidth:"100vw","&-rtl":{direction:"rtl"},"&-hidden":{display:"none"},[`${t}-content`]:{position:"relative"},[`${t}-inner`]:{backgroundColor:g,backgroundClip:"padding-box",borderRadius:l,boxShadow:n,padding:o},[`${t}-title`]:{minWidth:i,marginBottom:u,color:s,fontWeight:r,borderBottom:f,padding:_},[`${t}-inner-content`]:{color:a,padding:h}})},(0,m.default)(e,"var(--antd-arrow-background-color)"),{[`${t}-pure`]:{position:"relative",maxWidth:"none",margin:e.sizePopupArrow,display:"inline-block",[`${t}-content`]:{display:"inline-block"}}}]})(i),(e=>{let{componentCls:t}=e;return{[t]:_.PresetColors.map(a=>{let i=e[`${a}6`];return{[`&${t}-${a}`]:{"--antd-arrow-background-color":i,[`${t}-inner`]:{backgroundColor:i},[`${t}-arrow`]:{background:"transparent"}}}})}})(i),(0,p.initZoomMotion)(i,"zoom-big")]},e=>{let{lineWidth:t,controlHeight:a,fontHeight:i,padding:r,wireframe:o,zIndexPopupBase:n,borderRadiusLG:s,marginXS:l,lineType:d,colorSplit:u,paddingSM:c}=e,p=a-i;return Object.assign(Object.assign(Object.assign({titleMinWidth:177,zIndexPopup:n+30},(0,g.getArrowToken)(e)),(0,m.getArrowOffsetToken)({contentRadius:s,limitVerticalRadius:!0})),{innerPadding:12*!o,titleMarginBottom:o?0:l,titlePadding:o?`${p/2}px ${r}px ${p/2-t}px`:0,titleBorderBottom:o?`${t}px ${d} ${u}`:"none",innerContentPadding:o?`${c}px ${r}px`:0})},{resetStyle:!1,deprecatedTokens:[["width","titleMinWidth"],["minWidth","titleMinWidth"]]});var b=function(e,t){var a={};for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&0>t.indexOf(i)&&(a[i]=e[i]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var r=0,i=Object.getOwnPropertySymbols(e);r<i.length;r++)0>t.indexOf(i[r])&&Object.prototype.propertyIsEnumerable.call(e,i[r])&&(a[i[r]]=e[i[r]]);return a};let x=({title:e,content:a,prefixCls:i})=>e||a?t.createElement(t.Fragment,null,e&&t.createElement("div",{className:`${i}-title`},e),a&&t.createElement("div",{className:`${i}-inner-content`},a)):null,y=e=>{let{hashId:i,prefixCls:r,className:n,style:s,placement:l="top",title:d,content:c,children:p}=e,m=o(d),g=o(c),f=(0,a.default)(i,r,`${r}-pure`,`${r}-placement-${l}`,n);return t.createElement("div",{className:f,style:s},t.createElement("div",{className:`${r}-arrow`}),t.createElement(u.Popup,Object.assign({},e,{className:i,prefixCls:r}),p||t.createElement(x,{prefixCls:r,title:m,content:g})))},A=e=>{let{prefixCls:i,className:r}=e,o=b(e,["prefixCls","className"]),{getPrefixCls:n}=t.useContext(l.ConfigContext),s=n("popover",i),[d,u,c]=v(s);return d(t.createElement(y,Object.assign({},o,{prefixCls:s,hashId:u,className:(0,a.default)(r,c)})))};e.s(["Overlay",0,x,"default",0,A],310730);var I=function(e,t){var a={};for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&0>t.indexOf(i)&&(a[i]=e[i]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols)for(var r=0,i=Object.getOwnPropertySymbols(e);r<i.length;r++)0>t.indexOf(i[r])&&Object.prototype.propertyIsEnumerable.call(e,i[r])&&(a[i[r]]=e[i[r]]);return a};let O=t.forwardRef((e,u)=>{var c,p;let{prefixCls:m,title:g,content:f,overlayClassName:h,placement:_="top",trigger:b="hover",children:y,mouseEnterDelay:A=.1,mouseLeaveDelay:O=.1,onOpenChange:C,overlayStyle:E={},styles:S,classNames:w}=e,k=I(e,["prefixCls","title","content","overlayClassName","placement","trigger","children","mouseEnterDelay","mouseLeaveDelay","onOpenChange","overlayStyle","styles","classNames"]),{getPrefixCls:T,className:L,style:$,classNames:j,styles:M}=(0,l.useComponentConfig)("popover"),N=T("popover",m),[R,D,P]=v(N),z=T(),B=(0,a.default)(h,D,P,L,j.root,null==w?void 0:w.root),H=(0,a.default)(j.body,null==w?void 0:w.body),[V,F]=(0,i.default)(!1,{value:null!=(c=e.open)?c:e.visible,defaultValue:null!=(p=e.defaultOpen)?p:e.defaultVisible}),G=(e,t)=>{F(e,!0),null==C||C(e,t)},U=o(g),W=o(f);return R(t.createElement(d.default,Object.assign({placement:_,trigger:b,mouseEnterDelay:A,mouseLeaveDelay:O},k,{prefixCls:N,classNames:{root:B,body:H},styles:{root:Object.assign(Object.assign(Object.assign(Object.assign({},M.root),$),E),null==S?void 0:S.root),body:Object.assign(Object.assign({},M.body),null==S?void 0:S.body)},ref:u,open:V,onOpenChange:e=>{G(e)},overlay:U||W?t.createElement(x,{prefixCls:N,title:U,content:W}):null,transitionName:(0,n.getTransitionName)(z,"zoom-big",k.transitionName),"data-popover-inject":!0}),(0,s.cloneElement)(y,{onKeyDown:e=>{var a,i;(0,t.isValidElement)(y)&&(null==(i=null==y?void 0:(a=y.props).onKeyDown)||i.call(a,e)),e.keyCode===r.default.ESC&&G(!1,e)}})))});O._InternalPanelDoNotUseOrYouWillBeFired=A,e.s(["default",0,O],829672)},282786,e=>{"use strict";var t=e.i(829672);e.s(["Popover",()=>t.default])},771674,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"}}]},name:"user",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["UserOutlined",0,o],771674)},928685,e=>{"use strict";var t=e.i(38953);e.s(["SearchOutlined",()=>t.default])},755151,e=>{"use strict";var t=e.i(247153);e.s(["DownOutlined",()=>t.default])},916925,e=>{"use strict";var t,a=e.i(555987),i=((t={}).A2A_Agent="A2A Agent",t.AI21="Ai21",t.AI21_CHAT="Ai21 Chat",t.AIML="AI/ML API",t.AIOHTTP_OPENAI="Aiohttp Openai",t.Anthropic="Anthropic",t.ANTHROPIC_TEXT="Anthropic Text",t.AssemblyAI="AssemblyAI",t.AUTO_ROUTER="Auto Router",t.Bedrock="Amazon Bedrock",t.BedrockMantle="Amazon Bedrock Mantle",t.SageMaker="AWS SageMaker",t.Azure="Azure",t.Azure_AI_Studio="Azure AI Foundry (Studio)",t.AZURE_TEXT="Azure Text",t.BASETEN="Baseten",t.BYTEZ="Bytez",t.Cerebras="Cerebras",t.CLARIFAI="Clarifai",t.CLOUDFLARE="Cloudflare",t.CODESTRAL="Codestral",t.Cohere="Cohere",t.COHERE_CHAT="Cohere Chat",t.COMETAPI="Cometapi",t.COMPACTIFAI="Compactifai",t.Cursor="Cursor",t.Dashscope="Dashscope",t.Databricks="Databricks (Qwen API)",t.DATAROBOT="Datarobot",t.DeepInfra="DeepInfra",t.Deepgram="Deepgram",t.Deepseek="Deepseek",t.DOCKER_MODEL_RUNNER="Docker Model Runner",t.DOTPROMPT="Dotprompt",t.ElevenLabs="ElevenLabs",t.EMPOWER="Empower",t.FalAI="Fal AI",t.FEATHERLESS_AI="Featherless Ai",t.FireworksAI="Fireworks AI",t.FRIENDLIAI="Friendliai",t.GALADRIEL="Galadriel",t.GITHUB_COPILOT="Github Copilot",t.Google_AI_Studio="Google AI Studio",t.GradientAI="GradientAI",t.Groq="Groq",t.HEROKU="Heroku",t.Hosted_Vllm="vllm",t.HUGGINGFACE="Huggingface",t.HYPERBOLIC="Hyperbolic",t.Infinity="Infinity",t.JinaAI="Jina AI",t.LAMBDA_AI="Lambda Ai",t.LEMONADE="Lemonade",t.LLAMAFILE="Llamafile",t.LM_STUDIO="Lm Studio",t.LLAMA="Meta Llama",t.MARITALK="Maritalk",t.MiniMax="MiniMax",t.MistralAI="Mistral AI",t.MOONSHOT="Moonshot",t.MORPH="Morph",t.NEBIUS="Nebius",t.NLP_CLOUD="Nlp Cloud",t.NOVITA="Novita",t.NSCALE="Nscale",t.NVIDIA_NIM="Nvidia Nim",t.Ollama="Ollama",t.OLLAMA_CHAT="Ollama Chat",t.OOBABOOGA="Oobabooga",t.OpenAI="OpenAI",t.OPENAI_LIKE="Openai Like",t.OpenAI_Compatible="OpenAI-Compatible Chat Completions (Together AI, vLLM, etc.)",t.OpenAI_Text="OpenAI Text Completion",t.OpenAI_Text_Compatible="OpenAI-Compatible Completions (legacy /v1/completions)",t.Openrouter="Openrouter",t.Oracle="Oracle Cloud Infrastructure (OCI)",t.OVHCLOUD="Ovhcloud",t.Perplexity="Perplexity",t.PETALS="Petals",t.PG_VECTOR="Pg Vector",t.PREDIBASE="Predibase",t.RECRAFT="Recraft",t.REPLICATE="Replicate",t.RunwayML="RunwayML",t.SAGEMAKER_LEGACY="Sagemaker",t.Sambanova="Sambanova",t.SAP="SAP Generative AI Hub",t.Snowflake="Snowflake",t.Soniox="Soniox",t.TEXT_COMPLETION_CODESTRAL="Text-Completion-Codestral",t.TogetherAI="TogetherAI",t.TOPAZ="Topaz",t.Triton="Triton",t.V0="V0",t.VERCEL_AI_GATEWAY="Vercel Ai Gateway",t.Vertex_AI="Vertex AI (Anthropic, Gemini, etc.)",t.VERTEX_AI_BETA="Vertex Ai Beta",t.VLLM="Vllm",t.VolcEngine="VolcEngine",t.Voyage="Voyage AI",t.WANDB="Wandb",t.WATSONX="Watsonx",t.WATSONX_TEXT="Watsonx Text",t.xAI="xAI",t.XINFERENCE="Xinference",t.ZAI="Z.AI (Zhipu AI)",t);let r={A2A_Agent:"a2a_agent",AI21:"ai21",AI21_CHAT:"ai21_chat",AIML:"aiml",AIOHTTP_OPENAI:"aiohttp_openai",Anthropic:"anthropic",ANTHROPIC_TEXT:"anthropic_text",AssemblyAI:"assemblyai",AUTO_ROUTER:"auto_router",Azure:"azure",Azure_AI_Studio:"azure_ai",AZURE_TEXT:"azure_text",BASETEN:"baseten",Bedrock:"bedrock",BedrockMantle:"bedrock_mantle",BYTEZ:"bytez",Cerebras:"cerebras",CLARIFAI:"clarifai",CLOUDFLARE:"cloudflare",CODESTRAL:"codestral",Cohere:"cohere",COHERE_CHAT:"cohere_chat",COMETAPI:"cometapi",COMPACTIFAI:"compactifai",Cursor:"cursor",Dashscope:"dashscope",Databricks:"databricks",DATAROBOT:"datarobot",DeepInfra:"deepinfra",Deepgram:"deepgram",Deepseek:"deepseek",DOCKER_MODEL_RUNNER:"docker_model_runner",DOTPROMPT:"dotprompt",ElevenLabs:"elevenlabs",EMPOWER:"empower",FalAI:"fal_ai",FEATHERLESS_AI:"featherless_ai",FireworksAI:"fireworks_ai",FRIENDLIAI:"friendliai",GALADRIEL:"galadriel",GITHUB_COPILOT:"github_copilot",Google_AI_Studio:"gemini",GradientAI:"gradient_ai",Groq:"groq",HEROKU:"heroku",Hosted_Vllm:"hosted_vllm",HUGGINGFACE:"huggingface",HYPERBOLIC:"hyperbolic",Infinity:"infinity",JinaAI:"jina_ai",LAMBDA_AI:"lambda_ai",LEMONADE:"lemonade",LLAMAFILE:"llamafile",LLAMA:"meta_llama",LM_STUDIO:"lm_studio",MARITALK:"maritalk",MiniMax:"minimax",MistralAI:"mistral",MOONSHOT:"moonshot",MORPH:"morph",NEBIUS:"nebius",NLP_CLOUD:"nlp_cloud",NOVITA:"novita",NSCALE:"nscale",NVIDIA_NIM:"nvidia_nim",Ollama:"ollama",OLLAMA_CHAT:"ollama_chat",OOBABOOGA:"oobabooga",OpenAI:"openai",OPENAI_LIKE:"openai_like",OpenAI_Compatible:"openai",OpenAI_Text:"text-completion-openai",OpenAI_Text_Compatible:"text-completion-openai",Openrouter:"openrouter",Oracle:"oci",OVHCLOUD:"ovhcloud",Perplexity:"perplexity",PETALS:"petals",PG_VECTOR:"pg_vector",PREDIBASE:"predibase",RECRAFT:"recraft",REPLICATE:"replicate",RunwayML:"runwayml",SAGEMAKER_LEGACY:"sagemaker",SageMaker:"sagemaker_chat",Sambanova:"sambanova",SAP:"sap",Snowflake:"snowflake",Soniox:"soniox",TEXT_COMPLETION_CODESTRAL:"text-completion-codestral",TogetherAI:"together_ai",TOPAZ:"topaz",Triton:"triton",V0:"v0",VERCEL_AI_GATEWAY:"vercel_ai_gateway",Vertex_AI:"vertex_ai",VERTEX_AI_BETA:"vertex_ai_beta",VLLM:"vllm",VolcEngine:"volcengine",Voyage:"voyage",WANDB:"wandb",WATSONX:"watsonx",WATSONX_TEXT:"watsonx_text",xAI:"xai",XINFERENCE:"xinference",ZAI:"zai"},o=new Set(["bedrock_mantle"]),n="/ui/assets/logos/",s={"A2A Agent":`${n}a2a_agent.png`,Ai21:`${n}ai21.svg`,"Ai21 Chat":`${n}ai21.svg`,"AI/ML API":`${n}aiml_api.svg`,"Aiohttp Openai":`${n}openai_small.svg`,Anthropic:`${n}anthropic.svg`,"Anthropic Text":`${n}anthropic.svg`,AssemblyAI:`${n}assemblyai_small.png`,Azure:`${n}microsoft_azure.svg`,"Azure AI Foundry (Studio)":`${n}microsoft_azure.svg`,"Azure Text":`${n}microsoft_azure.svg`,Baseten:`${n}baseten.svg`,"Amazon Bedrock":`${n}bedrock.svg`,"Amazon Bedrock Mantle":`${n}bedrock.svg`,"AWS SageMaker":`${n}bedrock.svg`,Cerebras:`${n}cerebras.svg`,Cloudflare:`${n}cloudflare.svg`,Codestral:`${n}mistral.svg`,Cohere:`${n}cohere.svg`,"Cohere Chat":`${n}cohere.svg`,Cometapi:`${n}cometapi.svg`,Cursor:`${n}cursor.svg`,"Databricks (Qwen API)":`${n}databricks.svg`,Dashscope:`${n}dashscope.svg`,Deepseek:`${n}deepseek.svg`,Deepgram:`${n}deepgram.png`,DeepInfra:`${n}deepinfra.png`,ElevenLabs:`${n}elevenlabs.png`,"Fal AI":`${n}fal_ai.jpg`,"Featherless Ai":`${n}featherless.svg`,"Fireworks AI":`${n}fireworks.svg`,Friendliai:`${n}friendli.svg`,"Github Copilot":`${n}github_copilot.svg`,"Google AI Studio":`${n}google.svg`,GradientAI:`${n}gradientai.svg`,Groq:`${n}groq.svg`,vllm:`${n}vllm.png`,Huggingface:`${n}huggingface.svg`,Hyperbolic:`${n}hyperbolic.svg`,Infinity:`${n}infinity.png`,"Jina AI":`${n}jina.png`,"Lambda Ai":`${n}lambda.svg`,"Lm Studio":`${n}lmstudio.svg`,"Meta Llama":`${n}meta_llama.svg`,MiniMax:`${n}minimax.svg`,"Mistral AI":`${n}mistral.svg`,Moonshot:`${n}moonshot.svg`,Morph:`${n}morph.svg`,Nebius:`${n}nebius.svg`,Novita:`${n}novita.svg`,"Nvidia Nim":`${n}nvidia_nim.svg`,Ollama:`${n}ollama.svg`,"Ollama Chat":`${n}ollama.svg`,Oobabooga:`${n}openai_small.svg`,OpenAI:`${n}openai_small.svg`,"Openai Like":`${n}openai_small.svg`,"OpenAI Text Completion":`${n}openai_small.svg`,"OpenAI-Compatible Completions (legacy /v1/completions)":`${n}openai_small.svg`,"OpenAI-Compatible Chat Completions (Together AI, vLLM, etc.)":`${n}openai_small.svg`,Openrouter:`${n}openrouter.svg`,"Oracle Cloud Infrastructure (OCI)":`${n}oracle.svg`,Perplexity:`${n}perplexity-ai.svg`,Recraft:`${n}recraft.svg`,Replicate:`${n}replicate.svg`,RunwayML:`${n}runwayml.png`,Sagemaker:`${n}bedrock.svg`,Sambanova:`${n}sambanova.svg`,"SAP Generative AI Hub":`${n}sap.png`,Snowflake:`${n}snowflake.svg`,Soniox:`${n}soniox.svg`,"Text-Completion-Codestral":`${n}mistral.svg`,TogetherAI:`${n}togetherai.svg`,Topaz:`${n}topaz.svg`,Triton:`${n}nvidia_triton.png`,V0:`${n}v0.svg`,"Vercel Ai Gateway":`${n}vercel.svg`,"Vertex AI (Anthropic, Gemini, etc.)":`${n}google.svg`,"Vertex Ai Beta":`${n}google.svg`,Vllm:`${n}vllm.png`,VolcEngine:`${n}volcengine.png`,"Voyage AI":`${n}voyage.webp`,Watsonx:`${n}watsonx.svg`,"Watsonx Text":`${n}watsonx.svg`,xAI:`${n}xai.svg`,Xinference:`${n}xinference.svg`};e.s(["Providers",()=>i,"getPlaceholder",0,e=>{if("AI/ML API"===e)return"aiml/flux-pro/v1.1";if("Vertex AI (Anthropic, Gemini, etc.)"===e)return"gemini-pro";if("Anthropic"==e)return"claude-3-opus";if("Amazon Bedrock"==e)return"claude-3-opus";if("AWS SageMaker"==e)return"sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b";else if("Google AI Studio"==e)return"gemini-pro";else if("Azure AI Foundry (Studio)"==e)return"azure_ai/command-r-plus";else if("Azure"==e)return"my-deployment";else if("Oracle Cloud Infrastructure (OCI)"==e)return"oci/xai.grok-4";else if("Snowflake"==e)return"snowflake/mistral-7b";else if("Voyage AI"==e)return"voyage/";else if("Jina AI"==e)return"jina_ai/";else if("VolcEngine"==e)return"volcengine/<any-model-on-volcengine>";else if("DeepInfra"==e)return"deepinfra/<any-model-on-deepinfra>";else if("Fal AI"==e)return"fal_ai/fal-ai/flux-pro/v1.1-ultra";else if("RunwayML"==e)return"runwayml/gen4_turbo";else if("Watsonx"===e)return"watsonx/ibm/granite-3-3-8b-instruct";else if("Cursor"===e)return"cursor/claude-4-sonnet";else if("Z.AI (Zhipu AI)"===e)return"zai/glm-4.5";else return"gpt-3.5-turbo"},"getProviderLogoAndName",0,e=>{if(!e)return{logo:"",displayName:"-"};if("gemini"===e.toLowerCase()){let e="Google AI Studio";return{logo:(0,a.resolveLogoSrc)(s[e])??"",displayName:e}}let t=Object.keys(r).find(t=>r[t].toLowerCase()===e.toLowerCase())??Object.keys(r).find(t=>t.toLowerCase()===e.toLowerCase());if(!t)return{logo:"",displayName:e};let o=i[t];return{logo:(0,a.resolveLogoSrc)(s[o])??"",displayName:o}},"getProviderModels",0,(e,t)=>{let a=r[e],i=[];return e&&"object"==typeof t&&(Object.entries(t).forEach(([e,t])=>{if(null!==t&&"object"==typeof t&&"litellm_provider"in t){let r=t.litellm_provider,n="string"==typeof r&&(r.startsWith(`${a}_`)||r.startsWith(`${a}-`));(r===a||n&&!o.has(r))&&i.push(e)}}),"Cohere"==e&&Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"cohere_chat"===t.litellm_provider&&i.push(e)}),"AWS SageMaker"==e&&Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"sagemaker_chat"===t.litellm_provider&&i.push(e)})),i},"providerLogoMap",0,s,"provider_map",0,r])},596239,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M574 665.4a8.03 8.03 0 00-11.3 0L446.5 781.6c-53.8 53.8-144.6 59.5-204 0-59.5-59.5-53.8-150.2 0-204l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3l-39.8-39.8a8.03 8.03 0 00-11.3 0L191.4 526.5c-84.6 84.6-84.6 221.5 0 306s221.5 84.6 306 0l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3L574 665.4zm258.6-474c-84.6-84.6-221.5-84.6-306 0L410.3 307.6a8.03 8.03 0 000 11.3l39.7 39.7c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c53.8-53.8 144.6-59.5 204 0 59.5 59.5 53.8 150.2 0 204L665.3 562.6a8.03 8.03 0 000 11.3l39.8 39.8c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c84.5-84.6 84.5-221.5 0-306.1zM610.1 372.3a8.03 8.03 0 00-11.3 0L372.3 598.7a8.03 8.03 0 000 11.3l39.6 39.6c3.1 3.1 8.2 3.1 11.3 0l226.4-226.4c3.1-3.1 3.1-8.2 0-11.3l-39.5-39.6z"}}]},name:"link",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["LinkOutlined",0,o],596239)},652272,209261,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(447566),r=e.i(166406),o=e.i(492030),n=e.i(596239);let s=/^[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/,l=e=>e.trim().replace(/\/+$/,""),d=/\.(md|markdown|txt|json|ya?ml|toml)$/i,u=/^\d{1,3}(\.\d{1,3}){3}$/,c=/^[A-Za-z0-9-]+$/,p=/^[A-Za-z0-9._-]+$/,m=e=>e.pathname.split("/").filter(e=>""!==e),g=e=>{let t=e.split("/").filter(e=>""!==e);return t[t.length-1]??""},f=e=>e.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,""),h=e=>{let{source:t}=e;return"github"===t.source&&t.repo?`/plugin marketplace add ${t.repo}`:("url"===t.source||"git-subdir"===t.source)&&t.url?`/plugin marketplace add ${t.url}`:`/plugin marketplace add ${e.name}`};e.s(["formatInstallCommand",0,h,"getCategoryBadgeColor",0,e=>{if(!e)return"gray";let t=e.toLowerCase();if(t.includes("development")||t.includes("dev"))return"blue";if(t.includes("productivity")||t.includes("workflow"))return"green";if(t.includes("learning")||t.includes("education"))return"purple";if(t.includes("security")||t.includes("safety"))return"red";if(t.includes("data")||t.includes("analytics"))return"orange";else if(t.includes("integration")||t.includes("api"))return"yellow";return"gray"},"isValidEmail",0,e=>!e||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),"isValidSemanticVersion",0,e=>!e||/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(e),"isValidSubPath",0,e=>{let t=l(e);return""!==t&&s.test(t)},"isValidUrl",0,e=>{if(!e)return!0;try{return new URL(e),!0}catch{return!1}},"parseKeywords",0,e=>e&&""!==e.trim()?e.split(",").map(e=>e.trim()).filter(e=>""!==e):[],"parseSkillSource",0,(e,t)=>{let a=(e=>{let t,a=e.trim();if(""===a||a.startsWith("//"))return null;let i=/^[a-z][a-z0-9+.-]*:\/\//i.test(a)?a:`https://${a}`;try{t=new URL(i)}catch{return null}return"https:"!==t.protocol||""!==t.username||""!==t.password||!t.hostname.includes(".")||t.hostname.startsWith("[")||u.test(t.hostname)?null:t})(e);if(!a)return null;if("github.com"===a.hostname.replace(/^www\./,""))return((e,t)=>{let a=m(e);if(a.length<2)return null;let i=a[0],r=a[1].replace(/\.git$/,"");if(!c.test(i)||!p.test(r))return null;let o=`${i}/${r}`,n=`https://github.com/${o}`,u={parsed:{source:"github",repo:o},label:`GitHub repo — ${o}`,suggestedName:f(r)};if(a.length>=4&&("tree"===a[2]||"blob"===a[2])){let e=a.slice(4),t=g(e.join("/")),i=d.test(t)?e.slice(0,-1):e;if(0===i.length)return u;let r=l(i.join("/"));return s.test(r)?{parsed:{source:"git-subdir",url:n,path:r},label:`GitHub subdir — ${o} @ ${r}`,suggestedName:f(g(r))}:null}if(2!==a.length)return null;let h=l(t??"");return""!==h?s.test(h)?{parsed:{source:"git-subdir",url:n,path:h},label:`GitHub subdir — ${o} @ ${h}`,suggestedName:f(g(h))}:null:u})(a,t);if(m(a).length<2)return null;let i=`${a.protocol}//${a.host}${a.pathname.replace(/\/+$/,"")}`,r=l(t??"");return""!==r?s.test(r)?{parsed:{source:"git-subdir",url:i,path:r},label:`Git subdir — ${i} @ ${r}`,suggestedName:f(g(r))}:null:{parsed:{source:"url",url:i},label:`Git repo — ${i}`,suggestedName:f(g(a.pathname).replace(/\.git$/,""))}},"validatePluginName",0,e=>!!e&&""!==e.trim()&&/^[a-z0-9-]+$/.test(e)],209261),e.s(["default",0,({skill:e,onBack:s})=>{let l,[d,u]=(0,a.useState)("overview"),[c,p]=(0,a.useState)(null),m=(e,t)=>{navigator.clipboard.writeText(e),p(t),setTimeout(()=>p(null),2e3)},g="github"===(l=e.source).source&&l.repo?`https://github.com/${l.repo}`:"git-subdir"===l.source&&l.url?l.path?`${l.url}/tree/main/${l.path}`:l.url:"url"===l.source&&l.url?l.url:null,f=h(e),_=[...e.category?[{property:"Category",value:e.category}]:[],...e.domain?[{property:"Domain",value:e.domain}]:[],...e.namespace?[{property:"Namespace",value:e.namespace}]:[],...e.version?[{property:"Version",value:e.version}]:[],...e.author?.name?[{property:"Author",value:e.author.name}]:[],...e.created_at?[{property:"Added",value:new Date(e.created_at).toLocaleDateString()}]:[]];return(0,t.jsxs)("div",{style:{padding:"24px 32px 24px 0"},children:[(0,t.jsxs)("div",{onClick:s,style:{display:"inline-flex",alignItems:"center",gap:6,color:"#5f6368",cursor:"pointer",fontSize:14,marginBottom:24},children:[(0,t.jsx)(i.ArrowLeftOutlined,{style:{fontSize:11}}),(0,t.jsx)("span",{children:"Skills"})]}),(0,t.jsxs)("div",{style:{marginBottom:8},children:[(0,t.jsx)("h1",{style:{fontSize:28,fontWeight:400,color:"#202124",margin:0,lineHeight:1.2},children:e.name}),e.description&&(0,t.jsx)("p",{style:{fontSize:14,color:"#5f6368",margin:"8px 0 0 0",lineHeight:1.6},children:e.description})]}),(0,t.jsx)("div",{style:{borderBottom:"1px solid #dadce0",marginBottom:28,marginTop:24},children:(0,t.jsx)("div",{style:{display:"flex",gap:0},children:[{key:"overview",label:"Overview"},{key:"usage",label:"How to Use"}].map(e=>(0,t.jsx)("div",{onClick:()=>u(e.key),style:{padding:"12px 20px",fontSize:14,color:d===e.key?"#1a73e8":"#5f6368",borderBottom:d===e.key?"3px solid #1a73e8":"3px solid transparent",cursor:"pointer",fontWeight:d===e.key?500:400,marginBottom:-1},children:e.label},e.key))})}),"overview"===d&&(0,t.jsxs)("div",{style:{display:"flex",gap:64},children:[(0,t.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 4px 0"},children:"Skill Details"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#5f6368",margin:"0 0 16px 0"},children:"Metadata registered with this skill"}),(0,t.jsxs)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:14},children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{style:{borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("th",{style:{textAlign:"left",padding:"12px 0",color:"#5f6368",fontWeight:500,width:160},children:"Property"}),(0,t.jsx)("th",{style:{textAlign:"left",padding:"12px 0",color:"#5f6368",fontWeight:500},children:e.name})]})}),(0,t.jsx)("tbody",{children:_.map((e,a)=>(0,t.jsxs)("tr",{style:{borderBottom:"1px solid #f1f3f4"},children:[(0,t.jsx)("td",{style:{padding:"12px 0",color:"#3c4043"},children:e.property}),(0,t.jsx)("td",{style:{padding:"12px 0",color:"#202124"},children:e.value})]},a))})]})]}),(0,t.jsxs)("div",{style:{width:240,flexShrink:0},children:[(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Status"}),(0,t.jsx)("span",{style:{fontSize:12,padding:"3px 10px",borderRadius:12,backgroundColor:e.enabled?"#e6f4ea":"#f1f3f4",color:e.enabled?"#137333":"#5f6368",fontWeight:500},children:e.enabled?"Public":"Draft"})]}),g&&(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Source"}),(0,t.jsxs)("a",{href:g,target:"_blank",rel:"noopener noreferrer",style:{fontSize:13,color:"#1a73e8",wordBreak:"break-all",display:"flex",alignItems:"center",gap:4},children:[g.replace("https://",""),(0,t.jsx)(n.LinkOutlined,{style:{fontSize:11,flexShrink:0}})]})]}),e.keywords&&e.keywords.length>0&&(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:8},children:"Tags"}),(0,t.jsx)("div",{style:{display:"flex",flexWrap:"wrap",gap:6},children:e.keywords.map(e=>(0,t.jsx)("span",{style:{fontSize:12,padding:"4px 12px",borderRadius:16,border:"1px solid #dadce0",color:"#3c4043",backgroundColor:"#fff"},children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Skill ID"}),(0,t.jsx)("div",{style:{fontSize:12,fontFamily:"monospace",color:"#3c4043",wordBreak:"break-all"},children:e.id})]})]})]}),"usage"===d&&(0,t.jsxs)("div",{style:{maxWidth:640},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 8px 0"},children:"Using this skill"}),(0,t.jsx)("p",{style:{fontSize:14,color:"#5f6368",margin:"0 0 24px 0",lineHeight:1.6},children:"Once your proxy is set as a marketplace, enable this skill in Claude Code with one command:"}),(0,t.jsxs)("div",{style:{border:"1px solid #dadce0",borderRadius:8,overflow:"hidden",marginBottom:24},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",backgroundColor:"#f8f9fa",borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("span",{style:{fontSize:13,color:"#3c4043",fontWeight:500},children:"Run in Claude Code"}),(0,t.jsxs)("button",{onClick:()=>m(f,"install"),style:{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"install"===c?"#137333":"#1a73e8",background:"none",border:"none",cursor:"pointer",padding:0},children:["install"===c?(0,t.jsx)(o.CheckOutlined,{}):(0,t.jsx)(r.CopyOutlined,{}),"install"===c?"Copied":"Copy"]})]}),(0,t.jsx)("pre",{style:{margin:0,padding:"14px 16px",fontSize:14,fontFamily:"monospace",color:"#202124",backgroundColor:"#fff"},children:f})]}),(0,t.jsxs)("p",{style:{fontSize:13,color:"#5f6368",lineHeight:1.6,margin:0},children:["Don't have the marketplace configured yet?"," ",(0,t.jsx)("span",{onClick:()=>u("setup"),style:{color:"#1a73e8",cursor:"pointer"},children:"See one-time setup →"})]})]}),"setup"===d&&(0,t.jsxs)("div",{style:{maxWidth:640},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 8px 0"},children:"One-time marketplace setup"}),(0,t.jsxs)("p",{style:{fontSize:14,color:"#5f6368",margin:"0 0 24px 0",lineHeight:1.6},children:["Add this to"," ",(0,t.jsx)("code",{style:{fontSize:13,backgroundColor:"#f1f3f4",padding:"1px 6px",borderRadius:4},children:"~/.claude/settings.json"})," ","to point Claude Code at your proxy:"]}),(0,t.jsxs)("div",{style:{border:"1px solid #dadce0",borderRadius:8,overflow:"hidden"},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",backgroundColor:"#f8f9fa",borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("span",{style:{fontSize:13,color:"#3c4043",fontWeight:500},children:"~/.claude/settings.json"}),(0,t.jsxs)("button",{onClick:()=>{m(JSON.stringify({extraKnownMarketplaces:{"my-org":{source:"url",url:`${window.location.origin}/claude-code/marketplace.json`}}},null,2),"settings")},style:{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"settings"===c?"#137333":"#1a73e8",background:"none",border:"none",cursor:"pointer",padding:0},children:["settings"===c?(0,t.jsx)(o.CheckOutlined,{}):(0,t.jsx)(r.CopyOutlined,{}),"settings"===c?"Copied":"Copy"]})]}),(0,t.jsx)("pre",{style:{margin:0,padding:"14px 16px",fontSize:13,fontFamily:"monospace",color:"#202124",backgroundColor:"#fff"},children:JSON.stringify({extraKnownMarketplaces:{"my-org":{source:"url",url:`${window.location.origin}/claude-code/marketplace.json`}}},null,2)})]})]})]})}],652272)},339019,865361,e=>{"use strict";var t,a,i=((t={}).AUDIO_SPEECH="audio_speech",t.AUDIO_TRANSCRIPTION="audio_transcription",t.IMAGE_GENERATION="image_generation",t.VIDEO_GENERATION="video_generation",t.CHAT="chat",t.RESPONSES="responses",t.IMAGE_EDITS="image_edits",t.ANTHROPIC_MESSAGES="anthropic_messages",t.EMBEDDING="embedding",t),r=((a={}).IMAGE="image",a.VIDEO="video",a.CHAT="chat",a.RESPONSES="responses",a.IMAGE_EDITS="image_edits",a.ANTHROPIC_MESSAGES="anthropic_messages",a.EMBEDDINGS="embeddings",a.SPEECH="speech",a.TRANSCRIPTION="transcription",a.A2A_AGENTS="a2a_agents",a.MCP="mcp",a.REALTIME="realtime",a.INTERACTIONS="interactions",a);let o={image_generation:"image",video_generation:"video",chat:"chat",responses:"responses",image_edits:"image_edits",anthropic_messages:"anthropic_messages",audio_speech:"speech",audio_transcription:"transcription",embedding:"embeddings"};e.s(["EndpointType",()=>r,"getEndpointType",0,e=>Object.values(i).includes(e)?o[e]:"chat"],865361),e.s(["generateCodeSnippet",0,e=>{let t,{apiKeySource:a,accessToken:i,apiKey:o,inputMessage:n,chatHistory:s,selectedTags:l,selectedVectorStores:d,selectedGuardrails:u,selectedPolicies:c,selectedMCPServers:p,mcpServers:m,mcpServerToolRestrictions:g,selectedVoice:f,endpointType:h,selectedModel:_,selectedSdk:v,proxySettings:b}=e,x="session"===a?i:o,y=window.location.origin,A=b?.LITELLM_UI_API_DOC_BASE_URL;A&&A.trim()?y=A:b?.PROXY_BASE_URL&&(y=b.PROXY_BASE_URL);let I=n||"Your prompt here",O=I.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n"),C=s.filter(e=>!e.isImage).map(({role:e,content:t})=>({role:e,content:t})),E={};l.length>0&&(E.tags=l),d.length>0&&(E.vector_stores=d),u.length>0&&(E.guardrails=u),c.length>0&&(E.policies=c);let S=_||"your-model-name",w="azure"===v?`import openai

client = openai.AzureOpenAI(
	api_key="${x||"YOUR_LITELLM_API_KEY"}",
	azure_endpoint="${y}",
	api_version="2024-02-01"
)`:`import openai

client = openai.OpenAI(
	api_key="${x||"YOUR_LITELLM_API_KEY"}",
	base_url="${y}"
)`;switch(h){case r.CHAT:{let e=Object.keys(E).length>0,a="";if(e){let e=JSON.stringify({metadata:E},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let i=C.length>0?C:[{role:"user",content:I}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.chat.completions.create(
    model="${S}",
    messages=${JSON.stringify(i,null,4)}${a}
)

print(response)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.chat.completions.create(
#     model="${S}",
#     messages=[
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "text",
#                     "text": "${O}"
#                 },
#                 {
#                     "type": "image_url",
#                     "image_url": {
#                         "url": f"data:image/jpeg;base64,{base64_file}"  # or data:application/pdf;base64,{base64_file}
#                     }
#                 }
#             ]
#         }
#     ]${a}
# )
# print(response_with_file)
`;break}case r.RESPONSES:{let e=Object.keys(E).length>0,a="";if(e){let e=JSON.stringify({metadata:E},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let i=C.length>0?C:[{role:"user",content:I}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.responses.create(
    model="${S}",
    input=${JSON.stringify(i,null,4)}${a}
)

print(response.output_text)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.responses.create(
#     model="${S}",
#     input=[
#         {
#             "role": "user",
#             "content": [
#                 {"type": "input_text", "text": "${O}"},
#                 {
#                     "type": "input_image",
#                     "image_url": f"data:image/jpeg;base64,{base64_file}",  # or data:application/pdf;base64,{base64_file}
#                 },
#             ],
#         }
#     ]${a}
# )
# print(response_with_file.output_text)
`;break}case r.IMAGE:t="azure"===v?`
# NOTE: The Azure SDK does not have a direct equivalent to the multi-modal 'responses.create' method shown for OpenAI.
# This snippet uses 'client.images.generate' and will create a new image based on your prompt.
# It does not use the uploaded image, as 'client.images.generate' does not support image inputs in this context.
import os
import requests
import json
import time
from PIL import Image

result = client.images.generate(
	model="${S}",
	prompt="${n}",
	n=1
)

json_response = json.loads(result.model_dump_json())

# Set the directory for the stored image
image_dir = os.path.join(os.curdir, 'images')

# If the directory doesn't exist, create it
if not os.path.isdir(image_dir):
	os.mkdir(image_dir)

# Initialize the image path
image_filename = f"generated_image_{int(time.time())}.png"
image_path = os.path.join(image_dir, image_filename)

try:
	# Retrieve the generated image
	if json_response.get("data") && len(json_response["data"]) > 0 && json_response["data"][0].get("url"):
			image_url = json_response["data"][0]["url"]
			generated_image = requests.get(image_url).content
			with open(image_path, "wb") as image_file:
					image_file.write(generated_image)

			print(f"Image saved to {image_path}")
			# Display the image
			image = Image.open(image_path)
			image.show()
	else:
			print("Could not find image URL in response.")
			print("Full response:", json_response)
except Exception as e:
	print(f"An error occurred: {e}")
	print("Full response:", json_response)
`:`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${O}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case r.IMAGE_EDITS:t="azure"===v?`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# The prompt entered by the user
prompt = "${O}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`:`
import base64
import os
import time

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${O}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case r.EMBEDDINGS:t=`
response = client.embeddings.create(
	input="${n||"Your string here"}",
	model="${S}",
	encoding_format="base64" # or "float"
)

print(response.data[0].embedding)
`;break;case r.TRANSCRIPTION:t=`
# Open the audio file
audio_file = open("path/to/your/audio/file.mp3", "rb")

# Make the transcription request
response = client.audio.transcriptions.create(
	model="${S}",
	file=audio_file${n?`,
	prompt="${n.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:""}
)

print(response.text)
`;break;case r.SPEECH:t=`
# Make the text-to-speech request
response = client.audio.speech.create(
	model="${S}",
	input="${n||"Your text to convert to speech here"}",
	voice="${f}"  # Options: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
)

# Save the audio to a file
output_filename = "output_speech.mp3"
response.stream_to_file(output_filename)
print(f"Audio saved to {output_filename}")

# Optional: Customize response format and speed
# response = client.audio.speech.create(
#     model="${S}",
#     input="${n||"Your text to convert to speech here"}",
#     voice="alloy",
#     response_format="mp3",  # Options: mp3, opus, aac, flac, wav, pcm
#     speed=1.0  # Range: 0.25 to 4.0
# )
# response.stream_to_file("output_speech.mp3")
`;break;default:t="\n# Code generation for this endpoint is not implemented yet."}return`${w}
${t}`}],339019)},434626,e=>{"use strict";var t=e.i(271645);let a=t.forwardRef(function(e,a){return t.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:2,stroke:"currentColor","aria-hidden":"true",ref:a},e),t.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"}))});e.s(["ExternalLinkIcon",0,a],434626)},100486,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 00-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zm-126 534.1H250.3l-53.8-409.4 139.8 86.1L512 252.9l175.7 234.4 139.8-86.1-53.9 409.4zM512 509c-62.1 0-112.6 50.5-112.6 112.6S449.9 734.2 512 734.2s112.6-50.5 112.6-112.6S574.1 509 512 509zm0 160.9c-26.6 0-48.2-21.6-48.2-48.3 0-26.6 21.6-48.3 48.2-48.3s48.2 21.6 48.2 48.3c0 26.6-21.6 48.3-48.2 48.3z"}}]},name:"crown",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["CrownOutlined",0,o],100486)},879664,e=>{"use strict";let t=(0,e.i(475254).default)("info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);e.s(["default",0,t])},952571,e=>{"use strict";var t=e.i(879664);e.s(["Info",()=>t.default])},546467,e=>{"use strict";let t=(0,e.i(475254).default)("external-link",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);e.s(["default",0,t])},778917,e=>{"use strict";var t=e.i(546467);e.s(["ExternalLink",()=>t.default])},326373,e=>{"use strict";var t=e.i(21539);e.s(["Dropdown",()=>t.default])},602073,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"0 0 1024 1024",focusable:"false"},children:[{tag:"path",attrs:{d:"M512 64L128 192v384c0 212.1 171.9 384 384 384s384-171.9 384-384V192L512 64zm312 512c0 172.3-139.7 312-312 312S200 748.3 200 576V246l312-110 312 110v330z"}},{tag:"path",attrs:{d:"M378.4 475.1a35.91 35.91 0 00-50.9 0 35.91 35.91 0 000 50.9l129.4 129.4 2.1 2.1a33.98 33.98 0 0048.1 0L730.6 434a33.98 33.98 0 000-48.1l-2.8-2.8a33.98 33.98 0 00-48.1 0L483 579.7 378.4 475.1z"}}]},name:"safety",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["SafetyOutlined",0,o],602073)},477189,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M464 144H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H212V212h200v200zm452-268H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V160c0-8.8-7.2-16-16-16zm-52 268H612V212h200v200zM464 544H160c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H212V612h200v200zm452-268H560c-8.8 0-16 7.2-16 16v304c0 8.8 7.2 16 16 16h304c8.8 0 16-7.2 16-16V560c0-8.8-7.2-16-16-16zm-52 268H612V612h200v200z"}}]},name:"appstore",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["AppstoreOutlined",0,o],477189)},283713,e=>{"use strict";var t=e.i(271645),a=e.i(602869),i=e.i(612256);let r="litellm_selected_worker_id";e.s(["useWorker",0,()=>{let{data:e}=(0,i.useUIConfig)(),o=e?.is_control_plane??!1,n=e?.workers??[],[s,l]=(0,t.useState)(()=>localStorage.getItem(r));(0,t.useEffect)(()=>{if(!s||0===n.length)return;let e=n.find(e=>e.worker_id===s);e&&(0,a.switchToWorkerUrl)(e.url)},[s,n]);let d=n.find(e=>e.worker_id===s)??null,u=(0,t.useCallback)(e=>{let t=n.find(t=>t.worker_id===e);t&&(l(e),localStorage.setItem(r,e),(0,a.switchToWorkerUrl)(t.url))},[n]);return{isControlPlane:o,workers:n,selectedWorkerId:s,selectedWorker:d,selectWorker:u,disconnectFromWorker:(0,t.useCallback)(()=>{l(null),localStorage.removeItem(r),(0,a.switchToWorkerUrl)(null)},[])}}])},295320,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M704 446H320c-4.4 0-8 3.6-8 8v402c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8V454c0-4.4-3.6-8-8-8zm-328 64h272v117H376V510zm272 290H376V683h272v117z"}},{tag:"path",attrs:{d:"M424 748a32 32 0 1064 0 32 32 0 10-64 0zm0-178a32 32 0 1064 0 32 32 0 10-64 0z"}},{tag:"path",attrs:{d:"M811.4 368.9C765.6 248 648.9 162 512.2 162S258.8 247.9 213 368.8C126.9 391.5 63.5 470.2 64 563.6 64.6 668 145.6 752.9 247.6 762c4.7.4 8.7-3.3 8.7-8v-60.4c0-4-3-7.4-7-7.9-27-3.4-52.5-15.2-72.1-34.5-24-23.5-37.2-55.1-37.2-88.6 0-28 9.1-54.4 26.2-76.4 16.7-21.4 40.2-36.9 66.1-43.7l37.9-10 13.9-36.7c8.6-22.8 20.6-44.2 35.7-63.5 14.9-19.2 32.6-36 52.4-50 41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.3c19.9 14 37.5 30.8 52.4 50 15.1 19.3 27.1 40.7 35.7 63.5l13.8 36.6 37.8 10c54.2 14.4 92.1 63.7 92.1 120 0 33.6-13.2 65.1-37.2 88.6-19.5 19.2-44.9 31.1-71.9 34.5-4 .5-6.9 3.9-6.9 7.9V754c0 4.7 4.1 8.4 8.8 8 101.7-9.2 182.5-94 183.2-198.2.6-93.4-62.7-172.1-148.6-194.9z"}}]},name:"cloud-server",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.default,(0,t.default)({},e,{ref:o,icon:i}))});e.s(["CloudServerOutlined",0,o],295320)},560280,e=>{"use strict";var t=e.i(843476),a=e.i(271645),i=e.i(618566),r=e.i(976883);function o(){let e=(0,i.useSearchParams)().get("key"),[o,n]=(0,a.useState)(null);return(0,a.useEffect)(()=>{e&&n(e)},[e]),(0,t.jsx)(r.default,{accessToken:o})}e.s(["default",0,function(){return(0,t.jsx)(a.Suspense,{fallback:(0,t.jsx)("div",{className:"flex items-center justify-center min-h-screen",children:"Loading..."}),children:(0,t.jsx)(o,{})})}])}]);