/* Keep explicit checkbox changes authoritative when the compatibility adapter merges v1 data. */
(()=>{'use strict';
const key='packmate.trips.v1',native=window.PACKMATE_NATIVE_STORAGE,adapter=Storage.prototype.setItem;if(!native||!adapter)return;
Storage.prototype.setItem=function(name,value){
 if(name!==key)return adapter.call(this,name,value);
 try{
  const incoming=JSON.parse(value),stored=JSON.parse(native.getItem.call(this,key)||'[]');
  if(Array.isArray(incoming)&&Array.isArray(stored))incoming.forEach(next=>{
   const prior=stored.find(trip=>trip&&trip.id===next?.id);if(!prior)return;
   const oldItems=Array.isArray(prior.packing)?prior.packing:[];
   (Array.isArray(next.packing)?next.packing:[]).forEach(item=>{
    const match=oldItems.find(old=>old&&((item.id&&old.id===item.id)||String(old.name||'').trim().toLocaleLowerCase()===String(item.name||'').trim().toLocaleLowerCase()));
    if(match)match.done=!!item.done;
   });
  });
  native.setItem.call(this,key,JSON.stringify(stored));
 }catch(_){/* Let the original storage adapter handle malformed data. */}
 return adapter.call(this,name,value);
};
})();
