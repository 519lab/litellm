(()=>{"use strict";(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,596239,e=>{var t=e.i(931067),a=e.i(271645);let i={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M574 665.4a8.03 8.03 0 00-11.3 0L446.5 781.6c-53.8 53.8-144.6 59.5-204 0-59.5-59.5-53.8-150.2 0-204l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3l-39.8-39.8a8.03 8.03 0 00-11.3 0L191.4 526.5c-84.6 84.6-84.6 221.5 0 306s221.5 84.6 306 0l116.2-116.2c3.1-3.1 3.1-8.2 0-11.3L574 665.4zm258.6-474c-84.6-84.6-221.5-84.6-306 0L410.3 307.6a8.03 8.03 0 000 11.3l39.7 39.7c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c53.8-53.8 144.6-59.5 204 0 59.5 59.5 53.8 150.2 0 204L665.3 562.6a8.03 8.03 0 000 11.3l39.8 39.8c3.1 3.1 8.2 3.1 11.3 0l116.2-116.2c84.5-84.6 84.5-221.5 0-306.1zM610.1 372.3a8.03 8.03 0 00-11.3 0L372.3 598.7a8.03 8.03 0 000 11.3l39.6 39.6c3.1 3.1 8.2 3.1 11.3 0l226.4-226.4c3.1-3.1 3.1-8.2 0-11.3l-39.5-39.6z"}}]},name:"link",theme:"outlined"};var r=e.i(9583),o=a.forwardRef(function(e,o){return a.createElement(r.f,(0,t.f)({},e,{ref:o,icon:i}))});e.s(["f",0,o],596239)},928685,e=>{var t=e.i(38953);e.s(["f",()=>t.f])},395530,e=>{var t=e.i(271645),a=e.i(828918),i=e.i(838452),r=e.i(673553);e.s(["f",0,function(e={}){let{highlightItemOnHover:o,highlightedIndex:n,onHighlightedIndexChange:s}=(0,i.o)(),{ref:l,index:d}=(0,r.b)(e),p=n===d,c=t.useRef(null),u=(0,a.A)(l,c);return{compositeProps:{tabIndex:p?0:-1,onFocus(){s(d)},onMouseMove(){let e=c.current;if(!o||!e)return;let t=e.hasAttribute("disabled")||"true"===e.ariaDisabled;p||t||e.focus()}},compositeRef:u,index:d}}])},53687,e=>{var t=e.i(271645),a=e.i(921374),i=e.i(667865),r=e.i(146376),o=e.i(545356),n=e.i(843476);function s(){return new Map}function l(){return new Set}function d(e,t){let a=e.compareDocumentPosition(t);return a&Node.DOCUMENT_POSITION_FOLLOWING||a&Node.DOCUMENT_POSITION_CONTAINED_BY?-1:a&Node.DOCUMENT_POSITION_PRECEDING||a&Node.DOCUMENT_POSITION_CONTAINS?1:0}e.s(["f",0,function(e){let{children:p,elementsRef:c,labelsRef:u,onMapChange:m}=e,g=(0,i.f)(m),f=t.useRef(0),h=(0,a.f)(l).current,_=(0,a.f)(s).current,[b,x]=t.useState(0),A=t.useRef(b),y=(0,i.f)((e,t)=>{_.set(e,t??null),A.current+=1,x(A.current)}),v=(0,i.f)(e=>{_.delete(e),A.current+=1,x(A.current)}),I=t.useMemo(()=>{let e=new Map;return Array.from(_.keys()).filter(e=>e.isConnected).sort(d).forEach((t,a)=>{let i=_.get(t)??{};e.set(t,{...i,index:a})}),e},[_,b]);(0,r.f)(()=>{if("function"!=typeof MutationObserver||0===I.size)return;let e=new MutationObserver(e=>{let t=new Set,a=e=>t.has(e)?t.delete(e):t.add(e);e.forEach(e=>{e.removedNodes.forEach(a),e.addedNodes.forEach(a)}),0===t.size&&(A.current+=1,x(A.current))});return I.forEach((t,a)=>{a.parentElement&&e.observe(a.parentElement,{childList:!0})}),()=>{e.disconnect()}},[I]),(0,r.f)(()=>{A.current===b&&(c.current.length!==I.size&&(c.current.length=I.size),u&&u.current.length!==I.size&&(u.current.length=I.size),f.current=I.size),g(I)},[g,I,c,u,b]),(0,r.f)(()=>()=>{c.current=[]},[c]),(0,r.f)(()=>()=>{u&&(u.current=[])},[u]);let O=(0,i.f)(e=>(h.add(e),()=>{h.delete(e)}));(0,r.f)(()=>{h.forEach(e=>e(I))},[h,I]);let E=t.useMemo(()=>({register:y,unregister:v,subscribeMapChange:O,elementsRef:c,labelsRef:u,nextIndexRef:f}),[y,v,O,c,u,f]);return(0,n.jsx)(o.i.Provider,{value:E,children:p})}])},545356,e=>{e.i(247167);var t=e.i(271645);let a=t.createContext({register:()=>{},unregister:()=>{},subscribeMapChange:()=>()=>{},elementsRef:{current:[]},nextIndexRef:{current:0}});e.s(["i",0,a,"Q",0,function(){return t.useContext(a)}])},673553,e=>{var t,a=e.i(271645),i=e.i(146376),r=e.i(545356);let o=((t={})[t.None=0]="None",t[t.GuessFromOrder=1]="GuessFromOrder",t);e.s(["E",0,o,"b",0,function(e={}){let{label:t,metadata:n,textRef:s,indexGuessBehavior:l,index:d}=e,{register:p,unregister:c,subscribeMapChange:u,elementsRef:m,labelsRef:g,nextIndexRef:f}=(0,r.Q)(),h=a.useRef(-1),[_,b]=a.useState(d??(l===o.GuessFromOrder?()=>{if(-1===h.current){let e=f.current;f.current+=1,h.current=e}return h.current}:-1)),x=a.useRef(null),A=a.useCallback(e=>{if(x.current=e,-1!==_&&null!==e&&(m.current[_]=e,g)){let a=void 0!==t;g.current[_]=a?t:s?.current?.textContent??e.textContent}},[_,m,g,t,s]);return(0,i.f)(()=>{if(null!=d)return;let e=x.current;if(e)return p(e,n),()=>{c(e)}},[d,p,c,n]),(0,i.f)(()=>{if(null==d)return u(e=>{let t=x.current?e.get(x.current)?.index:null;null!=t&&b(t)})},[d,u,b]),{ref:A,index:_}}])},590803,e=>{e.s(["f",0,function(e){return null==e||e.hasAttribute("disabled")||"true"===e.getAttribute("aria-disabled")}])},678784,e=>{var t=e.i(678745);e.s(["f",()=>t.f])},409797,e=>{var t=e.i(631171);e.s(["f",()=>t.f])},373375,655900,e=>{let t=(0,e.i(475254).f)("chevron-left",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);e.s(["f",0,t],373375);var a=e.i(399219);e.s(["f",()=>a.f],655900)},233565,e=>{var t=e.i(246349);e.s(["f",()=>t.f])},399219,e=>{let t=(0,e.i(475254).f)("chevron-up",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);e.s(["f",0,t])},541071,e=>{let t=(0,e.i(475254).f)("ellipsis",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);e.s(["f",0,t],541071)},332102,e=>{let t=(0,e.i(475254).f)("inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);e.s(["f",0,t],332102)},879664,e=>{let t=(0,e.i(475254).f)("info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);e.s(["f",0,t])},952571,e=>{var t=e.i(879664);e.s(["f",()=>t.f])},16715,e=>{let t=(0,e.i(475254).f)("refresh-cw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);e.s(["f",0,t],16715)},339019,865361,e=>{var t,a,i=((t={}).AUDIO_SPEECH="audio_speech",t.AUDIO_TRANSCRIPTION="audio_transcription",t.IMAGE_GENERATION="image_generation",t.VIDEO_GENERATION="video_generation",t.CHAT="chat",t.RESPONSES="responses",t.IMAGE_EDITS="image_edits",t.ANTHROPIC_MESSAGES="anthropic_messages",t.EMBEDDING="embedding",t),r=((a={}).IMAGE="image",a.VIDEO="video",a.CHAT="chat",a.RESPONSES="responses",a.IMAGE_EDITS="image_edits",a.ANTHROPIC_MESSAGES="anthropic_messages",a.EMBEDDINGS="embeddings",a.SPEECH="speech",a.TRANSCRIPTION="transcription",a.A2A_AGENTS="a2a_agents",a.MCP="mcp",a.REALTIME="realtime",a.INTERACTIONS="interactions",a);let o={image_generation:"image",video_generation:"video",chat:"chat",responses:"responses",image_edits:"image_edits",anthropic_messages:"anthropic_messages",audio_speech:"speech",audio_transcription:"transcription",embedding:"embeddings"};e.s(["Q",()=>r,"t",0,e=>Object.values(i).includes(e)?o[e]:"chat"],865361),e.s(["f",0,e=>{let t,{apiKeySource:a,accessToken:i,apiKey:o,inputMessage:n,chatHistory:s,selectedTags:l,selectedVectorStores:d,selectedGuardrails:p,selectedPolicies:c,selectedMCPServers:u,mcpServers:m,mcpServerToolRestrictions:g,selectedVoice:f,endpointType:h,selectedModel:_,selectedSdk:b,proxySettings:x}=e,A="session"===a?i:o,y=window.location.origin,v=x?.LITELLM_UI_API_DOC_BASE_URL;v&&v.trim()?y=v:x?.PROXY_BASE_URL&&(y=x.PROXY_BASE_URL);let I=n||"Your prompt here",O=I.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n"),E=s.filter(e=>!e.isImage).map(({role:e,content:t})=>({role:e,content:t})),C={};l.length>0&&(C.tags=l),d.length>0&&(C.vector_stores=d),p.length>0&&(C.guardrails=p),c.length>0&&(C.policies=c);let w=_||"your-model-name",T="azure"===b?`import openai

client = openai.AzureOpenAI(
	api_key="${A||"YOUR_LITELLM_API_KEY"}",
	azure_endpoint="${y}",
	api_version="2024-02-01"
)`:`import openai

client = openai.OpenAI(
	api_key="${A||"YOUR_LITELLM_API_KEY"}",
	base_url="${y}"
)`;switch(h){case r.CHAT:{let e=Object.keys(C).length>0,a="";if(e){let e=JSON.stringify({metadata:C},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let i=E.length>0?E:[{role:"user",content:I}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.chat.completions.create(
    model="${w}",
    messages=${JSON.stringify(i,null,4)}${a}
)

print(response)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.chat.completions.create(
#     model="${w}",
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
`;break}case r.RESPONSES:{let e=Object.keys(C).length>0,a="";if(e){let e=JSON.stringify({metadata:C},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let i=E.length>0?E:[{role:"user",content:I}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.responses.create(
    model="${w}",
    input=${JSON.stringify(i,null,4)}${a}
)

print(response.output_text)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.responses.create(
#     model="${w}",
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
`;break}case r.IMAGE:t="azure"===b?`
# NOTE: The Azure SDK does not have a direct equivalent to the multi-modal 'responses.create' method shown for OpenAI.
# This snippet uses 'client.images.generate' and will create a new image based on your prompt.
# It does not use the uploaded image, as 'client.images.generate' does not support image inputs in this context.
import os
import requests
import json
import time
from PIL import Image

result = client.images.generate(
	model="${w}",
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
	model="${w}",
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
`;break;case r.IMAGE_EDITS:t="azure"===b?`
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
	model="${w}",
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
	model="${w}",
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
	model="${w}",
	encoding_format="base64" # or "float"
)

print(response.data[0].embedding)
`;break;case r.TRANSCRIPTION:t=`
# Open the audio file
audio_file = open("path/to/your/audio/file.mp3", "rb")

# Make the transcription request
response = client.audio.transcriptions.create(
	model="${w}",
	file=audio_file${n?`,
	prompt="${n.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:""}
)

print(response.text)
`;break;case r.SPEECH:t=`
# Make the text-to-speech request
response = client.audio.speech.create(
	model="${w}",
	input="${n||"Your text to convert to speech here"}",
	voice="${f}"  # Options: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
)

# Save the audio to a file
output_filename = "output_speech.mp3"
response.stream_to_file(output_filename)
print(f"Audio saved to {output_filename}")

# Optional: Customize response format and speed
# response = client.audio.speech.create(
#     model="${w}",
#     input="${n||"Your text to convert to speech here"}",
#     voice="alloy",
#     response_format="mp3",  # Options: mp3, opus, aac, flac, wav, pcm
#     speed=1.0  # Range: 0.25 to 4.0
# )
# response.stream_to_file("output_speech.mp3")
`;break;default:t="\n# Code generation for this endpoint is not implemented yet."}return`${T}
${t}`}],339019)},652272,209261,e=>{var t=e.i(843476),a=e.i(271645),i=e.i(447566),r=e.i(166406),o=e.i(492030),n=e.i(596239);let s=/^[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/,l=e=>e.trim().replace(/\/+$/,""),d=/\.(md|markdown|txt|json|ya?ml|toml)$/i,p=/^\d{1,3}(\.\d{1,3}){3}$/,c=/^[A-Za-z0-9-]+$/,u=/^[A-Za-z0-9._-]+$/,m=e=>e.pathname.split("/").filter(e=>""!==e),g=e=>{let t=e.split("/").filter(e=>""!==e);return t[t.length-1]??""},f=e=>e.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/^-+|-+$/g,""),h=e=>{let{source:t}=e;return"github"===t.source&&t.repo?`/plugin marketplace add ${t.repo}`:("url"===t.source||"git-subdir"===t.source)&&t.url?`/plugin marketplace add ${t.url}`:`/plugin marketplace add ${e.name}`};e.s(["a",0,h,"u",0,e=>{if(!e)return"gray";let t=e.toLowerCase();if(t.includes("development")||t.includes("dev"))return"blue";if(t.includes("productivity")||t.includes("workflow"))return"green";if(t.includes("learning")||t.includes("education"))return"purple";if(t.includes("security")||t.includes("safety"))return"red";if(t.includes("data")||t.includes("analytics"))return"orange";else if(t.includes("integration")||t.includes("api"))return"yellow";return"gray"},"r",0,e=>!e||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),"R",0,e=>!e||/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(e),"P",0,e=>{let t=l(e);return""!==t&&s.test(t)},"f",0,e=>{if(!e)return!0;try{return new URL(e),!0}catch{return!1}},"D",0,e=>e&&""!==e.trim()?e.split(",").map(e=>e.trim()).filter(e=>""!==e):[],"Z",0,(e,t)=>{let a=(e=>{let t,a=e.trim();if(""===a||a.startsWith("//"))return null;let i=/^[a-z][a-z0-9+.-]*:\/\//i.test(a)?a:`https://${a}`;try{t=new URL(i)}catch{return null}return"https:"!==t.protocol||""!==t.username||""!==t.password||!t.hostname.includes(".")||t.hostname.startsWith("[")||p.test(t.hostname)?null:t})(e);if(!a)return null;if("github.com"===a.hostname.replace(/^www\./,""))return((e,t)=>{let a=m(e);if(a.length<2)return null;let i=a[0],r=a[1].replace(/\.git$/,"");if(!c.test(i)||!u.test(r))return null;let o=`${i}/${r}`,n=`https://github.com/${o}`,p={parsed:{source:"github",repo:o},label:`GitHub repo — ${o}`,suggestedName:f(r)};if(a.length>=4&&("tree"===a[2]||"blob"===a[2])){let e=a.slice(4),t=g(e.join("/")),i=d.test(t)?e.slice(0,-1):e;if(0===i.length)return p;let r=l(i.join("/"));return s.test(r)?{parsed:{source:"git-subdir",url:n,path:r},label:`GitHub subdir — ${o} @ ${r}`,suggestedName:f(g(r))}:null}if(2!==a.length)return null;let h=l(t??"");return""!==h?s.test(h)?{parsed:{source:"git-subdir",url:n,path:h},label:`GitHub subdir — ${o} @ ${h}`,suggestedName:f(g(h))}:null:p})(a,t);if(m(a).length<2)return null;let i=`${a.protocol}//${a.host}${a.pathname.replace(/\/+$/,"")}`,r=l(t??"");return""!==r?s.test(r)?{parsed:{source:"git-subdir",url:i,path:r},label:`Git subdir — ${i} @ ${r}`,suggestedName:f(g(r))}:null:{parsed:{source:"url",url:i},label:`Git repo — ${i}`,suggestedName:f(g(a.pathname).replace(/\.git$/,""))}},"e",0,e=>!!e&&""!==e.trim()&&/^[a-z0-9-]+$/.test(e)],209261),e.s(["f",0,({skill:e,onBack:s})=>{let l,[d,p]=(0,a.useState)("overview"),[c,u]=(0,a.useState)(null),m=(e,t)=>{navigator.clipboard.writeText(e),u(t),setTimeout(()=>u(null),2e3)},g="github"===(l=e.source).source&&l.repo?`https://github.com/${l.repo}`:"git-subdir"===l.source&&l.url?l.path?`${l.url}/tree/main/${l.path}`:l.url:"url"===l.source&&l.url?l.url:null,f=h(e),_=[...e.category?[{property:"Category",value:e.category}]:[],...e.domain?[{property:"Domain",value:e.domain}]:[],...e.namespace?[{property:"Namespace",value:e.namespace}]:[],...e.version?[{property:"Version",value:e.version}]:[],...e.author?.name?[{property:"Author",value:e.author.name}]:[],...e.created_at?[{property:"Added",value:new Date(e.created_at).toLocaleDateString()}]:[]];return(0,t.jsxs)("div",{style:{padding:"24px 32px 24px 0"},children:[(0,t.jsxs)("div",{onClick:s,style:{display:"inline-flex",alignItems:"center",gap:6,color:"#5f6368",cursor:"pointer",fontSize:14,marginBottom:24},children:[(0,t.jsx)(i.f,{style:{fontSize:11}}),(0,t.jsx)("span",{children:"Skills"})]}),(0,t.jsxs)("div",{style:{marginBottom:8},children:[(0,t.jsx)("h1",{style:{fontSize:28,fontWeight:400,color:"#202124",margin:0,lineHeight:1.2},children:e.name}),e.description&&(0,t.jsx)("p",{style:{fontSize:14,color:"#5f6368",margin:"8px 0 0 0",lineHeight:1.6},children:e.description})]}),(0,t.jsx)("div",{style:{borderBottom:"1px solid #dadce0",marginBottom:28,marginTop:24},children:(0,t.jsx)("div",{style:{display:"flex",gap:0},children:[{key:"overview",label:"Overview"},{key:"usage",label:"How to Use"}].map(e=>(0,t.jsx)("div",{onClick:()=>p(e.key),style:{padding:"12px 20px",fontSize:14,color:d===e.key?"#1a73e8":"#5f6368",borderBottom:d===e.key?"3px solid #1a73e8":"3px solid transparent",cursor:"pointer",fontWeight:d===e.key?500:400,marginBottom:-1},children:e.label},e.key))})}),"overview"===d&&(0,t.jsxs)("div",{style:{display:"flex",gap:64},children:[(0,t.jsxs)("div",{style:{flex:1,minWidth:0},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 4px 0"},children:"Skill Details"}),(0,t.jsx)("p",{style:{fontSize:13,color:"#5f6368",margin:"0 0 16px 0"},children:"Metadata registered with this skill"}),(0,t.jsxs)("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:14},children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{style:{borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("th",{style:{textAlign:"left",padding:"12px 0",color:"#5f6368",fontWeight:500,width:160},children:"Property"}),(0,t.jsx)("th",{style:{textAlign:"left",padding:"12px 0",color:"#5f6368",fontWeight:500},children:e.name})]})}),(0,t.jsx)("tbody",{children:_.map((e,a)=>(0,t.jsxs)("tr",{style:{borderBottom:"1px solid #f1f3f4"},children:[(0,t.jsx)("td",{style:{padding:"12px 0",color:"#3c4043"},children:e.property}),(0,t.jsx)("td",{style:{padding:"12px 0",color:"#202124"},children:e.value})]},a))})]})]}),(0,t.jsxs)("div",{style:{width:240,flexShrink:0},children:[(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Status"}),(0,t.jsx)("span",{style:{fontSize:12,padding:"3px 10px",borderRadius:12,backgroundColor:e.enabled?"#e6f4ea":"#f1f3f4",color:e.enabled?"#137333":"#5f6368",fontWeight:500},children:e.enabled?"Public":"Draft"})]}),g&&(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Source"}),(0,t.jsxs)("a",{href:g,target:"_blank",rel:"noopener noreferrer",style:{fontSize:13,color:"#1a73e8",wordBreak:"break-all",display:"flex",alignItems:"center",gap:4},children:[g.replace("https://",""),(0,t.jsx)(n.f,{style:{fontSize:11,flexShrink:0}})]})]}),e.keywords&&e.keywords.length>0&&(0,t.jsxs)("div",{style:{marginBottom:24},children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:8},children:"Tags"}),(0,t.jsx)("div",{style:{display:"flex",flexWrap:"wrap",gap:6},children:e.keywords.map(e=>(0,t.jsx)("span",{style:{fontSize:12,padding:"4px 12px",borderRadius:16,border:"1px solid #dadce0",color:"#3c4043",backgroundColor:"#fff"},children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("div",{style:{fontSize:12,color:"#5f6368",marginBottom:4},children:"Skill ID"}),(0,t.jsx)("div",{style:{fontSize:12,fontFamily:"monospace",color:"#3c4043",wordBreak:"break-all"},children:e.id})]})]})]}),"usage"===d&&(0,t.jsxs)("div",{style:{maxWidth:640},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 8px 0"},children:"Using this skill"}),(0,t.jsx)("p",{style:{fontSize:14,color:"#5f6368",margin:"0 0 24px 0",lineHeight:1.6},children:"Once your proxy is set as a marketplace, enable this skill in Claude Code with one command:"}),(0,t.jsxs)("div",{style:{border:"1px solid #dadce0",borderRadius:8,overflow:"hidden",marginBottom:24},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",backgroundColor:"#f8f9fa",borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("span",{style:{fontSize:13,color:"#3c4043",fontWeight:500},children:"Run in Claude Code"}),(0,t.jsxs)("button",{onClick:()=>m(f,"install"),style:{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"install"===c?"#137333":"#1a73e8",background:"none",border:"none",cursor:"pointer",padding:0},children:["install"===c?(0,t.jsx)(o.f,{}):(0,t.jsx)(r.f,{}),"install"===c?"Copied":"Copy"]})]}),(0,t.jsx)("pre",{style:{margin:0,padding:"14px 16px",fontSize:14,fontFamily:"monospace",color:"#202124",backgroundColor:"#fff"},children:f})]}),(0,t.jsxs)("p",{style:{fontSize:13,color:"#5f6368",lineHeight:1.6,margin:0},children:["Don't have the marketplace configured yet?"," ",(0,t.jsx)("span",{onClick:()=>p("setup"),style:{color:"#1a73e8",cursor:"pointer"},children:"See one-time setup →"})]})]}),"setup"===d&&(0,t.jsxs)("div",{style:{maxWidth:640},children:[(0,t.jsx)("h2",{style:{fontSize:18,fontWeight:400,color:"#202124",margin:"0 0 8px 0"},children:"One-time marketplace setup"}),(0,t.jsxs)("p",{style:{fontSize:14,color:"#5f6368",margin:"0 0 24px 0",lineHeight:1.6},children:["Add this to"," ",(0,t.jsx)("code",{style:{fontSize:13,backgroundColor:"#f1f3f4",padding:"1px 6px",borderRadius:4},children:"~/.claude/settings.json"})," ","to point Claude Code at your proxy:"]}),(0,t.jsxs)("div",{style:{border:"1px solid #dadce0",borderRadius:8,overflow:"hidden"},children:[(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",backgroundColor:"#f8f9fa",borderBottom:"1px solid #dadce0"},children:[(0,t.jsx)("span",{style:{fontSize:13,color:"#3c4043",fontWeight:500},children:"~/.claude/settings.json"}),(0,t.jsxs)("button",{onClick:()=>{m(JSON.stringify({extraKnownMarketplaces:{"my-org":{source:"url",url:`${window.location.origin}/claude-code/marketplace.json`}}},null,2),"settings")},style:{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"settings"===c?"#137333":"#1a73e8",background:"none",border:"none",cursor:"pointer",padding:0},children:["settings"===c?(0,t.jsx)(o.f,{}):(0,t.jsx)(r.f,{}),"settings"===c?"Copied":"Copy"]})]}),(0,t.jsx)("pre",{style:{margin:0,padding:"14px 16px",fontSize:13,fontFamily:"monospace",color:"#202124",backgroundColor:"#fff"},children:JSON.stringify({extraKnownMarketplaces:{"my-org":{source:"url",url:`${window.location.origin}/claude-code/marketplace.json`}}},null,2)})]})]})]})}],652272)},916925,e=>{var t,a=e.i(555987),i=((t={}).A2A_Agent="A2A Agent",t.AI21="Ai21",t.AI21_CHAT="Ai21 Chat",t.AIML="AI/ML API",t.AIOHTTP_OPENAI="Aiohttp Openai",t.Anthropic="Anthropic",t.ANTHROPIC_TEXT="Anthropic Text",t.AssemblyAI="AssemblyAI",t.AUTO_ROUTER="Auto Router",t.Bedrock="Amazon Bedrock",t.BedrockMantle="Amazon Bedrock Mantle",t.SageMaker="AWS SageMaker",t.Azure="Azure",t.Azure_AI_Studio="Azure AI Foundry (Studio)",t.AZURE_TEXT="Azure Text",t.BASETEN="Baseten",t.BYTEZ="Bytez",t.Cerebras="Cerebras",t.CLARIFAI="Clarifai",t.CLOUDFLARE="Cloudflare",t.CODESTRAL="Codestral",t.Cohere="Cohere",t.COHERE_CHAT="Cohere Chat",t.COMETAPI="Cometapi",t.COMPACTIFAI="Compactifai",t.Cursor="Cursor",t.Dashscope="Dashscope",t.Databricks="Databricks (Qwen API)",t.DATAROBOT="Datarobot",t.DeepInfra="DeepInfra",t.Deepgram="Deepgram",t.Deepseek="Deepseek",t.DOCKER_MODEL_RUNNER="Docker Model Runner",t.DOTPROMPT="Dotprompt",t.ElevenLabs="ElevenLabs",t.EMPOWER="Empower",t.FalAI="Fal AI",t.FEATHERLESS_AI="Featherless Ai",t.FireworksAI="Fireworks AI",t.FRIENDLIAI="Friendliai",t.GALADRIEL="Galadriel",t.GITHUB_COPILOT="Github Copilot",t.Google_AI_Studio="Google AI Studio",t.GradientAI="GradientAI",t.Groq="Groq",t.HEROKU="Heroku",t.Hosted_Vllm="vllm",t.HUGGINGFACE="Huggingface",t.HYPERBOLIC="Hyperbolic",t.Infinity="Infinity",t.JinaAI="Jina AI",t.LAMBDA_AI="Lambda Ai",t.LEMONADE="Lemonade",t.LLAMAFILE="Llamafile",t.LM_STUDIO="Lm Studio",t.LLAMA="Meta Llama",t.MARITALK="Maritalk",t.MiniMax="MiniMax",t.MistralAI="Mistral AI",t.MOONSHOT="Moonshot",t.MORPH="Morph",t.NEBIUS="Nebius",t.NLP_CLOUD="Nlp Cloud",t.NOVITA="Novita",t.NSCALE="Nscale",t.NVIDIA_NIM="Nvidia Nim",t.Ollama="Ollama",t.OLLAMA_CHAT="Ollama Chat",t.OOBABOOGA="Oobabooga",t.OpenAI="OpenAI",t.OPENAI_LIKE="Openai Like",t.OpenAI_Compatible="OpenAI-Compatible Chat Completions (Together AI, vLLM, etc.)",t.OpenAI_Text="OpenAI Text Completion",t.OpenAI_Text_Compatible="OpenAI-Compatible Completions (legacy /v1/completions)",t.Openrouter="Openrouter",t.Oracle="Oracle Cloud Infrastructure (OCI)",t.OVHCLOUD="Ovhcloud",t.Perplexity="Perplexity",t.PETALS="Petals",t.PG_VECTOR="Pg Vector",t.PREDIBASE="Predibase",t.RECRAFT="Recraft",t.REPLICATE="Replicate",t.RunwayML="RunwayML",t.SAGEMAKER_LEGACY="Sagemaker",t.Sambanova="Sambanova",t.SAP="SAP Generative AI Hub",t.Snowflake="Snowflake",t.Soniox="Soniox",t.TEXT_COMPLETION_CODESTRAL="Text-Completion-Codestral",t.TogetherAI="TogetherAI",t.TOPAZ="Topaz",t.Triton="Triton",t.V0="V0",t.VERCEL_AI_GATEWAY="Vercel Ai Gateway",t.Vertex_AI="Vertex AI (Anthropic, Gemini, etc.)",t.VERTEX_AI_BETA="Vertex Ai Beta",t.VLLM="Vllm",t.VolcEngine="VolcEngine",t.Voyage="Voyage AI",t.WANDB="Wandb",t.WATSONX="Watsonx",t.WATSONX_TEXT="Watsonx Text",t.xAI="xAI",t.XINFERENCE="Xinference",t.ZAI="Z.AI (Zhipu AI)",t);let r={A2A_Agent:"a2a_agent",AI21:"ai21",AI21_CHAT:"ai21_chat",AIML:"aiml",AIOHTTP_OPENAI:"aiohttp_openai",Anthropic:"anthropic",ANTHROPIC_TEXT:"anthropic_text",AssemblyAI:"assemblyai",AUTO_ROUTER:"auto_router",Azure:"azure",Azure_AI_Studio:"azure_ai",AZURE_TEXT:"azure_text",BASETEN:"baseten",Bedrock:"bedrock",BedrockMantle:"bedrock_mantle",BYTEZ:"bytez",Cerebras:"cerebras",CLARIFAI:"clarifai",CLOUDFLARE:"cloudflare",CODESTRAL:"codestral",Cohere:"cohere",COHERE_CHAT:"cohere_chat",COMETAPI:"cometapi",COMPACTIFAI:"compactifai",Cursor:"cursor",Dashscope:"dashscope",Databricks:"databricks",DATAROBOT:"datarobot",DeepInfra:"deepinfra",Deepgram:"deepgram",Deepseek:"deepseek",DOCKER_MODEL_RUNNER:"docker_model_runner",DOTPROMPT:"dotprompt",ElevenLabs:"elevenlabs",EMPOWER:"empower",FalAI:"fal_ai",FEATHERLESS_AI:"featherless_ai",FireworksAI:"fireworks_ai",FRIENDLIAI:"friendliai",GALADRIEL:"galadriel",GITHUB_COPILOT:"github_copilot",Google_AI_Studio:"gemini",GradientAI:"gradient_ai",Groq:"groq",HEROKU:"heroku",Hosted_Vllm:"hosted_vllm",HUGGINGFACE:"huggingface",HYPERBOLIC:"hyperbolic",Infinity:"infinity",JinaAI:"jina_ai",LAMBDA_AI:"lambda_ai",LEMONADE:"lemonade",LLAMAFILE:"llamafile",LLAMA:"meta_llama",LM_STUDIO:"lm_studio",MARITALK:"maritalk",MiniMax:"minimax",MistralAI:"mistral",MOONSHOT:"moonshot",MORPH:"morph",NEBIUS:"nebius",NLP_CLOUD:"nlp_cloud",NOVITA:"novita",NSCALE:"nscale",NVIDIA_NIM:"nvidia_nim",Ollama:"ollama",OLLAMA_CHAT:"ollama_chat",OOBABOOGA:"oobabooga",OpenAI:"openai",OPENAI_LIKE:"openai_like",OpenAI_Compatible:"openai",OpenAI_Text:"text-completion-openai",OpenAI_Text_Compatible:"text-completion-openai",Openrouter:"openrouter",Oracle:"oci",OVHCLOUD:"ovhcloud",Perplexity:"perplexity",PETALS:"petals",PG_VECTOR:"pg_vector",PREDIBASE:"predibase",RECRAFT:"recraft",REPLICATE:"replicate",RunwayML:"runwayml",SAGEMAKER_LEGACY:"sagemaker",SageMaker:"sagemaker_chat",Sambanova:"sambanova",SAP:"sap",Snowflake:"snowflake",Soniox:"soniox",TEXT_COMPLETION_CODESTRAL:"text-completion-codestral",TogetherAI:"together_ai",TOPAZ:"topaz",Triton:"triton",V0:"v0",VERCEL_AI_GATEWAY:"vercel_ai_gateway",Vertex_AI:"vertex_ai",VERTEX_AI_BETA:"vertex_ai_beta",VLLM:"vllm",VolcEngine:"volcengine",Voyage:"voyage",WANDB:"wandb",WATSONX:"watsonx",WATSONX_TEXT:"watsonx_text",xAI:"xai",XINFERENCE:"xinference",ZAI:"zai"},o=new Set(["bedrock_mantle"]),n="/ui/assets/logos/",s={"A2A Agent":`${n}a2a_agent.png`,Ai21:`${n}ai21.svg`,"Ai21 Chat":`${n}ai21.svg`,"AI/ML API":`${n}aiml_api.svg`,"Aiohttp Openai":`${n}openai_small.svg`,Anthropic:`${n}anthropic.svg`,"Anthropic Text":`${n}anthropic.svg`,AssemblyAI:`${n}assemblyai_small.png`,Azure:`${n}microsoft_azure.svg`,"Azure AI Foundry (Studio)":`${n}microsoft_azure.svg`,"Azure Text":`${n}microsoft_azure.svg`,Baseten:`${n}baseten.svg`,"Amazon Bedrock":`${n}bedrock.svg`,"Amazon Bedrock Mantle":`${n}bedrock.svg`,"AWS SageMaker":`${n}bedrock.svg`,Cerebras:`${n}cerebras.svg`,Cloudflare:`${n}cloudflare.svg`,Codestral:`${n}mistral.svg`,Cohere:`${n}cohere.svg`,"Cohere Chat":`${n}cohere.svg`,Cometapi:`${n}cometapi.svg`,Cursor:`${n}cursor.svg`,"Databricks (Qwen API)":`${n}databricks.svg`,Dashscope:`${n}dashscope.svg`,Deepseek:`${n}deepseek.svg`,Deepgram:`${n}deepgram.png`,DeepInfra:`${n}deepinfra.png`,ElevenLabs:`${n}elevenlabs.png`,"Fal AI":`${n}fal_ai.jpg`,"Featherless Ai":`${n}featherless.svg`,"Fireworks AI":`${n}fireworks.svg`,Friendliai:`${n}friendli.svg`,"Github Copilot":`${n}github_copilot.svg`,"Google AI Studio":`${n}google.svg`,GradientAI:`${n}gradientai.svg`,Groq:`${n}groq.svg`,vllm:`${n}vllm.png`,Huggingface:`${n}huggingface.svg`,Hyperbolic:`${n}hyperbolic.svg`,Infinity:`${n}infinity.png`,"Jina AI":`${n}jina.png`,"Lambda Ai":`${n}lambda.svg`,"Lm Studio":`${n}lmstudio.svg`,"Meta Llama":`${n}meta_llama.svg`,MiniMax:`${n}minimax.svg`,"Mistral AI":`${n}mistral.svg`,Moonshot:`${n}moonshot.svg`,Morph:`${n}morph.svg`,Nebius:`${n}nebius.svg`,Novita:`${n}novita.svg`,"Nvidia Nim":`${n}nvidia_nim.svg`,Ollama:`${n}ollama.svg`,"Ollama Chat":`${n}ollama.svg`,Oobabooga:`${n}openai_small.svg`,OpenAI:`${n}openai_small.svg`,"Openai Like":`${n}openai_small.svg`,"OpenAI Text Completion":`${n}openai_small.svg`,"OpenAI-Compatible Completions (legacy /v1/completions)":`${n}openai_small.svg`,"OpenAI-Compatible Chat Completions (Together AI, vLLM, etc.)":`${n}openai_small.svg`,Openrouter:`${n}openrouter.svg`,"Oracle Cloud Infrastructure (OCI)":`${n}oracle.svg`,Perplexity:`${n}perplexity-ai.svg`,Recraft:`${n}recraft.svg`,Replicate:`${n}replicate.svg`,RunwayML:`${n}runwayml.png`,Sagemaker:`${n}bedrock.svg`,Sambanova:`${n}sambanova.svg`,"SAP Generative AI Hub":`${n}sap.png`,Snowflake:`${n}snowflake.svg`,Soniox:`${n}soniox.svg`,"Text-Completion-Codestral":`${n}mistral.svg`,TogetherAI:`${n}togetherai.svg`,Topaz:`${n}topaz.svg`,Triton:`${n}nvidia_triton.png`,V0:`${n}v0.svg`,"Vercel Ai Gateway":`${n}vercel.svg`,"Vertex AI (Anthropic, Gemini, etc.)":`${n}google.svg`,"Vertex Ai Beta":`${n}google.svg`,Vllm:`${n}vllm.png`,VolcEngine:`${n}volcengine.png`,"Voyage AI":`${n}voyage.webp`,Watsonx:`${n}watsonx.svg`,"Watsonx Text":`${n}watsonx.svg`,xAI:`${n}xai.svg`,Xinference:`${n}xinference.svg`};e.s(["g",()=>i,"J",0,e=>{if("AI/ML API"===e)return"aiml/flux-pro/v1.1";if("Vertex AI (Anthropic, Gemini, etc.)"===e)return"gemini-pro";if("Anthropic"==e)return"claude-3-opus";if("Amazon Bedrock"==e)return"claude-3-opus";if("AWS SageMaker"==e)return"sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b";else if("Google AI Studio"==e)return"gemini-pro";else if("Azure AI Foundry (Studio)"==e)return"azure_ai/command-r-plus";else if("Azure"==e)return"my-deployment";else if("Oracle Cloud Infrastructure (OCI)"==e)return"oci/xai.grok-4";else if("Snowflake"==e)return"snowflake/mistral-7b";else if("Voyage AI"==e)return"voyage/";else if("Jina AI"==e)return"jina_ai/";else if("VolcEngine"==e)return"volcengine/<any-model-on-volcengine>";else if("DeepInfra"==e)return"deepinfra/<any-model-on-deepinfra>";else if("Fal AI"==e)return"fal_ai/fal-ai/flux-pro/v1.1-ultra";else if("RunwayML"==e)return"runwayml/gen4_turbo";else if("Watsonx"===e)return"watsonx/ibm/granite-3-3-8b-instruct";else if("Cursor"===e)return"cursor/claude-4-sonnet";else if("Z.AI (Zhipu AI)"===e)return"zai/glm-4.5";else return"gpt-3.5-turbo"},"h",0,e=>{if(!e)return{logo:"",displayName:"-"};if("gemini"===e.toLowerCase()){let e="Google AI Studio";return{logo:(0,a.f)(s[e])??"",displayName:e}}let t=Object.keys(r).find(t=>r[t].toLowerCase()===e.toLowerCase())??Object.keys(r).find(t=>t.toLowerCase()===e.toLowerCase());if(!t)return{logo:"",displayName:e};let o=i[t];return{logo:(0,a.f)(s[o])??"",displayName:o}},"D",0,(e,t)=>{let a=r[e],i=[];return e&&"object"==typeof t&&(Object.entries(t).forEach(([e,t])=>{if(null!==t&&"object"==typeof t&&"litellm_provider"in t){let r=t.litellm_provider,n="string"==typeof r&&(r.startsWith(`${a}_`)||r.startsWith(`${a}-`));(r===a||n&&!o.has(r))&&i.push(e)}}),"Cohere"==e&&Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"cohere_chat"===t.litellm_provider&&i.push(e)}),"AWS SageMaker"==e&&Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"sagemaker_chat"===t.litellm_provider&&i.push(e)})),i},"N",0,s,"U",0,r])},755146,e=>{var t=e.i(843476),a=e.i(65426),i=e.i(606078),r=e.i(984756),o=e.i(256737),n=e.i(383110),s=e.i(160948),s=s,l=e.i(777222),d=e.i(218141),p=e.i(873969),c=s,u=e.i(115504);e.i(233565);var m=e.i(678784);e.s(["G",0,function({...e}){return(0,t.jsx)(a.f.Root,{"data-slot":"dropdown-menu",...e})},"Q",0,function({className:e,children:a,checked:i,inset:r,...o}){return(0,t.jsxs)(d.f.CheckboxItem,{"data-slot":"dropdown-menu-checkbox-item","data-inset":r,className:(0,u.c)("relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-8 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",e),checked:i,...o,children:[(0,t.jsx)("span",{className:"pointer-events-none absolute right-2 flex items-center justify-center","data-slot":"dropdown-menu-checkbox-item-indicator",children:(0,t.jsx)(p.f.CheckboxItemIndicator,{children:(0,t.jsx)(m.f,{})})}),a]})},"L",0,function({align:e="start",alignOffset:a=0,side:r="bottom",sideOffset:s=4,className:l,...d}){return(0,t.jsx)(i.f.Portal,{children:(0,t.jsx)(o.f.Positioner,{className:"isolate z-50 outline-none",align:e,alignOffset:a,side:r,sideOffset:s,children:(0,t.jsx)(n.f.Popup,{"data-slot":"dropdown-menu-content",className:(0,u.c)("z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",l),...d})})})},"r",0,function({className:e,inset:a,variant:i="default",...r}){return(0,t.jsx)(l.f.Item,{"data-slot":"dropdown-menu-item","data-inset":a,"data-variant":i,className:(0,u.c)("group/dropdown-menu-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",e),...r})},"U",0,function({className:e,...a}){return(0,t.jsx)(c.Separator,{"data-slot":"dropdown-menu-separator",className:(0,u.c)("-mx-1 my-1 h-px bg-border",e),...a})},"X",0,function({...e}){return(0,t.jsx)(r.f.Trigger,{"data-slot":"dropdown-menu-trigger",...e})}],755146)},793479,e=>{var t=e.i(843476),a=e.i(271645),i=e.i(115504);let r=a.forwardRef(({className:e,type:a,...r},o)=>(0,t.jsx)("input",{type:a,"data-slot":"input",className:(0,i.c)("h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30","focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50","aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",e),ref:o,...r}));r.displayName="Input",e.s(["f",0,r])},110204,e=>{var t=e.i(843476),a=e.i(271645),i=e.i(115504);let r=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("label",{ref:r,"data-slot":"label",className:(0,i.c)("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",e),...a}));r.displayName="Label",e.s(["f",0,r])},980376,e=>{var t=e.i(843476),a=e.i(526323);e.i(998218);var i=e.i(921637),r=e.i(209977),o=e.i(141708),n=e.i(593480),s=e.i(309169),l=e.i(152744),d=e.i(115504),p=e.i(519455),c=e.i(995926);function u({...e}){return(0,t.jsx)(r.f.Portal,{"data-slot":"sheet-portal",...e})}function m({className:e,...a}){return(0,t.jsx)(o.f.Backdrop,{"data-slot":"sheet-overlay",className:(0,d.c)("fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",e),...a})}e.s(["j",0,function({...e}){return(0,t.jsx)(a.f.Root,{"data-slot":"sheet",...e})},"O",0,function({...e}){return(0,t.jsx)(i.f.Close,{"data-slot":"sheet-close",...e})},"U",0,function({className:e,children:a,side:r="right",showCloseButton:o=!0,...s}){return(0,t.jsxs)(u,{children:[(0,t.jsx)(m,{}),(0,t.jsxs)(n.f.Popup,{"data-slot":"sheet-content","data-side":r,className:(0,d.c)("fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",e),...s,children:[a,o&&(0,t.jsxs)(i.f.Close,{"data-slot":"sheet-close",render:(0,t.jsx)(p.K,{variant:"ghost",className:"absolute top-4 right-4",size:"icon-sm"}),children:[(0,t.jsx)(c.f,{}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})},"c",0,function({className:e,...a}){return(0,t.jsx)(l.f.Description,{"data-slot":"sheet-description",className:(0,d.c)("text-sm text-muted-foreground",e),...a})},"J",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"sheet-footer",className:(0,d.c)("mt-auto flex flex-col gap-2 p-4",e),...a})},"D",0,function({className:e,...a}){return(0,t.jsx)("div",{"data-slot":"sheet-header",className:(0,d.c)("flex flex-col gap-1.5 p-4",e),...a})},"L",0,function({className:e,...a}){return(0,t.jsx)(s.f.Title,{"data-slot":"sheet-title",className:(0,d.c)("font-medium text-foreground",e),...a})}])},302747,e=>{var t=e.i(843476),a=e.i(271645),i=e.i(115504);let r=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("div",{ref:r,"data-slot":"skeleton",className:(0,i.c)("animate-pulse rounded-md bg-accent",e),...a}));r.displayName="Skeleton",e.s(["f",0,r])},784774,e=>{var t=e.i(843476),a=e.i(271645),i=e.i(115504);let r=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("div",{"data-slot":"table-container",className:"relative w-full overflow-x-auto",children:(0,t.jsx)("table",{ref:r,"data-slot":"table",className:(0,i.c)("w-full caption-bottom text-sm",e),...a})}));r.displayName="Table";let o=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("thead",{ref:r,"data-slot":"table-header",className:(0,i.c)("[&_tr]:border-b",e),...a}));o.displayName="TableHeader";let n=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("tbody",{ref:r,"data-slot":"table-body",className:(0,i.c)("[&_tr:last-child]:border-0",e),...a}));n.displayName="TableBody";let s=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("tfoot",{ref:r,"data-slot":"table-footer",className:(0,i.c)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",e),...a}));s.displayName="TableFooter";let l=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("tr",{ref:r,"data-slot":"table-row",className:(0,i.c)("border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",e),...a}));l.displayName="TableRow";let d=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("th",{ref:r,"data-slot":"table-head",className:(0,i.c)("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",e),...a}));d.displayName="TableHead";let p=a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("td",{ref:r,"data-slot":"table-cell",className:(0,i.c)("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",e),...a}));p.displayName="TableCell",(a.forwardRef(({className:e,...a},r)=>(0,t.jsx)("caption",{ref:r,"data-slot":"table-caption",className:(0,i.c)("mt-4 text-sm text-muted-foreground",e),...a}))).displayName="TableCaption",e.s(["s",0,r,"z",0,n,"d",0,p,"U",0,s,"V",0,d,"E",0,o,"N",0,l])}])})();