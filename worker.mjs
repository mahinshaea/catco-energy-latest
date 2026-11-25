import { onRequest } from "./functions/api/enquiries.js";
export default {
  fetch(request,env){
    if(new URL(request.url).pathname==="/api/enquiries")return onRequest({request,env});
    return env.ASSETS.fetch(request);
  }
};
