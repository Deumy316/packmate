/* Explicit, user-confirmed, one-way local trip migration. Never runs an INSERT on load or login. */
(() => {
  'use strict';
  const auth = window.PACKMATE_AUTH;
  if (!auth || typeof auth.subscribe !== 'function' || typeof auth.readCloudImportOverview !== 'function' || typeof auth.insertCloudImportTrip !== 'function') return;

  const messages = {
    ko: {
      button:'로컬 일정 이전',title:'내 일정 클라우드로 복사',intro:'백업을 확인한 뒤 직접 동의해야 복사가 시작됩니다. 기존 기기 데이터는 변경되거나 삭제되지 않습니다.',account:'이전 대상 계정',localCount:'이 기기의 일정',newCount:'신규 이전 대상',sameCount:'동일 내용으로 건너뜀',conflictCount:'내용 충돌',errorCount:'데이터 오류',backupCheck:'JSON 백업 다운로드를 완료했고, 기존 로컬 원본은 보존된다는 점을 확인했습니다.',consent:'백업과 대상 계정을 확인했습니다. 표시된 신규 일정만 이 계정에 복사하는 데 동의합니다.',submit:'동의하고 {count}개 일정 복사',working:'계정의 최신 클라우드 일정을 확인하는 중…',inserting:'동의한 신규 일정을 하나씩 복사하는 중…',verifying:'클라우드 payload를 다시 읽어 원본과 확인하는 중…',complete:'확인 완료: 신규 이전 대상 중 {count}개 일정이 클라우드 원본과 일치합니다. 기존 로컬 데이터는 그대로 보존되어 있습니다.',partial:'이전 결과: 신규 대상 중 확인된 일정 {success}개, 아직 확인되지 않은 일정 {failed}개. 백업 체크 후 다시 실행하면 최신 클라우드 내용을 확인해 재시도합니다.',noNew:'새로 복사할 일정이 없습니다. 동일 내용은 건너뛰고 충돌·오류 일정은 복사하지 않습니다.',error:'일정 비교 또는 이전을 완료하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요. 로컬 데이터는 변경되지 않았습니다.',changed:'로그인 계정이 바뀌어 이전 작업과 결과를 초기화했습니다. 새 계정을 확인한 뒤 다시 시작해 주세요.',changedPreview:'미리보기 이후 로컬 또는 클라우드 데이터가 달라졌습니다. 새 내용을 확인하고 이전 동의를 다시 해 주세요. 아무 일정도 복사하지 않았습니다.',consentRequired:'백업 확인 체크박스를 선택하고 명시적으로 동의해야 이전을 시작할 수 있습니다.',close:'닫기',refresh:'일정 다시 비교',tripSummary:'일정 {total}개 · 신규 {fresh}개 · 동일 {same}개 · 충돌 {conflict}개 · 오류 {error}개',settings:'개인 필수품·사용자 활동 설정은 이 작업에서 이전하지 않습니다.'
    },
    en: {
      button:'Migrate local trips',title:'Copy my trips to the cloud',intro:'Copying starts only after you verify your backup and explicitly agree. Existing data on this device will not be changed or deleted.',account:'Destination account',localCount:'Trips on this device',newCount:'New trips to copy',sameCount:'Skipped: same content',conflictCount:'Content conflicts',errorCount:'Data errors',backupCheck:'I downloaded the JSON backup and understand that the original local data will be preserved.',consent:'I verified the backup and destination account, and agree to copy only the new trips shown to this account.',submit:'Agree and copy {count} trips',working:'Checking the account’s latest cloud trips…',inserting:'Copying the agreed new trips one at a time…',verifying:'Re-reading cloud payloads and verifying them against the originals…',complete:'Verified: {count} new trips match their originals in the cloud. The local data remains unchanged.',partial:'Migration result: {success} new trips verified, {failed} not yet verified. Check the backup box and run again to retry against the latest cloud data.',noNew:'There are no new trips to copy. Identical trips are skipped; conflicting or invalid trips are not copied.',error:'Could not complete the comparison or migration. Check your connection and try again. Local data was not changed.',changed:'The signed-in account changed. The previous operation and its results were cleared. Verify the new account before starting again.',changedPreview:'Local or cloud data changed since the preview. Review the new results and explicitly agree again. No trips were copied.',consentRequired:'Select the backup confirmation checkbox and explicitly agree before migration can start.',close:'Close',refresh:'Compare trips again',tripSummary:'{total} trips · {fresh} new · {same} identical · {conflict} conflicts · {error} errors',settings:'Personal essentials and custom activity settings are not migrated in this operation.'
    },
    tl: {
      button:'Ilipat ang mga lokal na iskedyul',title:'Kopyahin ang mga iskedyul sa cloud',intro:'Magsisimula lang ang pagkopya kapag nakumpirma mo ang backup at tahasan kang sumang-ayon. Hindi babaguhin o buburahin ang dating data sa device.',account:'Account na tatanggap',localCount:'Mga iskedyul sa device na ito',newCount:'Mga bagong ililipat',sameCount:'Nilaktawan: magkapareho',conflictCount:'Mga salungatan sa nilalaman',errorCount:'Mga error sa data',backupCheck:'Na-download ko ang JSON backup at nauunawaan kong pananatilihin ang orihinal na lokal na data.',consent:'Nasuri ko ang backup at account na tatanggap, at sumasang-ayon akong kopyahin lamang ang mga bagong iskedyul na ipinapakita sa account na ito.',submit:'Sumang-ayon at kopyahin ang {count} iskedyul',working:'Sinusuri ang pinakabagong iskedyul sa cloud ng account…',inserting:'Isa-isang kinokopya ang mga bagong iskedyul na sinang-ayunan…',verifying:'Binabasa muli ang cloud payload at ikinukumpara sa orihinal…',complete:'Na-verify: {count} bagong iskedyul ang kapareho ng orihinal sa cloud. Hindi binago ang lokal na data.',partial:'Resulta: {success} bagong iskedyul ang na-verify, {failed} ang hindi pa. Lagyan ng tsek ang backup at patakbuhin muli upang subukan laban sa pinakabagong cloud data.',noNew:'Walang bagong iskedyul na kokopyahin. Nilalaktawan ang magkapareho; hindi kokopyahin ang may salungatan o hindi wastong data.',error:'Hindi nakumpleto ang paghahambing o paglilipat. Suriin ang koneksyon at subukan muli. Hindi binago ang lokal na data.',changed:'Nagbago ang naka-log in na account. Nilinis ang dating operasyon at resulta. Suriin ang bagong account bago magsimula muli.',changedPreview:'Nagbago ang lokal o cloud data mula nang gawin ang preview. Suriin ang bagong resulta at tahasang sumang-ayon muli. Walang nakopyang iskedyul.',consentRequired:'Piliin ang checkbox ng kumpirmasyon sa backup at tahasang sumang-ayon bago magsimula ang paglilipat.',close:'Isara',refresh:'Ihambing muli ang mga iskedyul',tripSummary:'{total} iskedyul · {fresh} bago · {same} magkapareho · {conflict} salungatan · {error} error',settings:'Hindi kasama sa operasyong ito ang personal na gamit at custom na setting ng aktibidad.'
    }
  };
  const STORAGE_KEY = 'packmate.trips.v1';
  const host = document.getElementById('packmateAuth');
  if (!host) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'pm-auth-button pm-cloud-migration-button'; button.hidden = true; button.setAttribute('aria-haspopup','dialog');
  const dialog = document.createElement('dialog');
  dialog.className = 'pm-cloud-migration-dialog'; dialog.setAttribute('aria-labelledby','pmMigrationTitle');
  dialog.innerHTML = `<div class="pm-cloud-dialog-header"><div><p class="pm-cloud-kicker">PACKMATE</p><h2 id="pmMigrationTitle"></h2></div></div><p class="pm-migration-intro"></p><dl class="pm-migration-metrics"><div><dt data-migration-label="account"></dt><dd data-migration-value="account"></dd></div><div><dt data-migration-label="localCount"></dt><dd data-migration-value="localCount">—</dd></div><div><dt data-migration-label="newCount"></dt><dd data-migration-value="newCount">—</dd></div><div><dt data-migration-label="sameCount"></dt><dd data-migration-value="sameCount">—</dd></div><div><dt data-migration-label="conflictCount"></dt><dd data-migration-value="conflictCount">—</dd></div><div><dt data-migration-label="errorCount"></dt><dd data-migration-value="errorCount">—</dd></div></dl><p class="pm-migration-summary" role="status" aria-live="polite"></p><label class="pm-migration-backup-check"><input type="checkbox" data-migration-backup-check><span></span></label><p class="pm-migration-consent"></p><p class="pm-migration-settings"></p><p class="pm-migration-status" role="status" aria-live="polite"></p><div class="pm-migration-actions"><button type="button" class="pm-cloud-refresh" data-migration-refresh></button><button type="button" class="pm-cloud-preview" data-migration-submit disabled></button><button type="button" class="pm-cloud-dismiss" data-migration-close></button></div>`;
  host.insertAdjacentElement('afterend',button); document.body.append(dialog);
  const $ = selector => dialog.querySelector(selector);
  const statusNode = $('.pm-migration-status'), summaryNode = $('.pm-migration-summary'), backupCheck = $('[data-migration-backup-check]'), submitButton = $('[data-migration-submit]'), refreshButton = $('[data-migration-refresh]'), accountNode = $('[data-migration-value="account"]');
  let currentUser=null,currentIdentity='',generation=0,controller=null,busy=false,snapshot=null,lastRun=null,statusMessage='';
  function tr(key) { const chosen=document.getElementById('packmateLanguageSelect')?.value||window.PACKMATE_I18N?.language||document.documentElement.lang||'ko'; const language=Object.hasOwn(messages,chosen)?chosen:'ko'; return messages[language][key]||messages.ko[key]||''; }
  function format(key,values={}) { return tr(key).replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??'')); }
  function identity(user) { return user?.id?`${user.id}\u0000${user.email||''}`:''; }
  function stillCurrent(gen,expected) { return generation===gen&&currentIdentity===expected&&identity(auth.getCurrentUser())===expected; }
  function canonical(value) { if(value===null||typeof value!=='object') return JSON.stringify(value); if(Array.isArray(value)) return `[${value.map(item=>canonical(item)??'null').join(',')}]`; return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`; }
  function validTrip(trip) { return Boolean(trip&&typeof trip==='object'&&!Array.isArray(trip)&&typeof trip.id==='string'&&trip.id.trim()); }
  function readLocal() {
    let raw; try { raw=window.localStorage.getItem(STORAGE_KEY); } catch(_) { return {ok:false}; }
    if(raw===null) return {ok:true,raw,trips:[],issues:[]};
    let trips; try { trips=JSON.parse(raw); } catch(_) { return {ok:false}; }
    if(!Array.isArray(trips)) return {ok:false};
    const ids=new Map(); trips.forEach(trip=>{if(validTrip(trip)) ids.set(trip.id,(ids.get(trip.id)||0)+1);});
    const issues=[]; trips.forEach((trip,index)=>{if(!validTrip(trip))issues.push({index});else if(ids.get(trip.id)>1)issues.push({index});});
    return {ok:true,raw,trips,issues};
  }
  function compare(local,cloudRows) {
    if(!local.ok||!Array.isArray(cloudRows)) return {ok:false,records:[],counts:{fresh:0,same:0,conflict:0,error:1}};
    const cloud=new Map();
    for(const row of cloudRows) { if(!row||typeof row.tripId!=='string'||!row.tripId.trim()) continue; const list=cloud.get(row.tripId)||[]; list.push(row.payload); cloud.set(row.tripId,list); }
    const invalid=new Set(local.issues.map(issue=>issue.index)), counts={fresh:0,same:0,conflict:0,error:0};
    const records=local.trips.map((trip,index)=>{
      if(invalid.has(index)){counts.error++;return {trip,category:'error'};}
      const rows=cloud.get(trip.id)||[];
      if(rows.length===0){counts.fresh++;return {trip,category:'fresh'};}
      if(rows.length!==1){counts.error++;return {trip,category:'error'};}
      const payload=rows[0];
      if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.id!==trip.id){counts.error++;return {trip,category:'error'};}
      if(canonical(trip)===canonical(payload)){counts.same++;return {trip,category:'same'};}
      counts.conflict++;return {trip,category:'conflict'};
    });
    return {ok:true,records,counts};
  }
  function clearOutput() { snapshot=null;lastRun=null;statusMessage='';statusNode.textContent='';summaryNode.textContent='';dialog.querySelectorAll('[data-migration-value]').forEach(node=>{if(node.dataset.migrationValue!=='account')node.textContent='—';});submitButton.disabled=true;refreshButton.disabled=busy; }
  function renderCounts(comparison,total) {
    const c=comparison.counts;
    $('[data-migration-value="localCount"]').textContent=String(total); $('[data-migration-value="newCount"]').textContent=String(c.fresh); $('[data-migration-value="sameCount"]').textContent=String(c.same); $('[data-migration-value="conflictCount"]').textContent=String(c.conflict); $('[data-migration-value="errorCount"]').textContent=String(c.error);
    summaryNode.textContent=format('tripSummary',{total,fresh:c.fresh,same:c.same,conflict:c.conflict,error:c.error}); submitButton.textContent=format('submit',{count:c.fresh}); submitButton.disabled=busy||c.fresh===0||!backupCheck.checked;
  }
  function renderRun(run) { if(!run)return; if(run.errorKey)statusNode.textContent=tr(run.errorKey);else if(run.success>0&&run.failed===0)statusNode.textContent=format('complete',{count:run.success});else if(run.attempted===0&&run.failed===0)statusNode.textContent=tr('noNew');else statusNode.textContent=format('partial',{success:run.success,failed:run.failed}); }
  function updateText() {
    button.textContent=tr('button'); $('#pmMigrationTitle').textContent=tr('title'); $('.pm-migration-intro').textContent=tr('intro');
    dialog.querySelectorAll('[data-migration-label]').forEach(node=>node.textContent=tr(node.dataset.migrationLabel)); $('.pm-migration-backup-check span').textContent=tr('backupCheck'); $('.pm-migration-consent').textContent=tr('consent'); $('.pm-migration-settings').textContent=tr('settings'); refreshButton.textContent=tr('refresh');
    dialog.querySelectorAll('[data-migration-close]').forEach(node=>{node.textContent=tr('close');node.setAttribute('aria-label',tr('close'));});
    if(snapshot)renderCounts(snapshot.comparison,snapshot.local.trips.length); if(statusMessage)statusNode.textContent=tr(statusMessage); if(lastRun)renderRun(lastRun);
  }
  function resetForAccount(user) { generation++;if(controller)controller.abort();controller=null;busy=false;currentUser=user;currentIdentity=identity(user);clearOutput();backupCheck.checked=false;accountNode.textContent=user?.email||user?.id||'—';submitButton.disabled=true;refreshButton.disabled=false;if(dialog.open)dialog.close(); }
  async function fetchComparison(gen,expected,signal) {
    const local=readLocal(); if(!local.ok)return {ok:false,errorKey:'error'}; if(!stillCurrent(gen,expected))return {ok:false,changed:true};
    const cloud=await auth.readCloudImportOverview(currentUser.id,signal); if(!stillCurrent(gen,expected))return {ok:false,changed:true};
    if(!cloud?.ok||cloud.userId!==currentUser.id||!Array.isArray(cloud.tripRows))return {ok:false,errorKey:'error'};
    const comparison=compare(local,cloud.tripRows);return comparison.ok?{ok:true,local,cloud,comparison}:{ok:false,errorKey:'error'};
  }
  async function refreshPreview() {
    if(busy||!currentUser?.id)return;const expected=currentIdentity,gen=++generation;if(controller)controller.abort();controller=new AbortController();const signal=controller.signal;
    busy=true;clearOutput();refreshButton.disabled=true;submitButton.disabled=true;statusMessage='working';statusNode.textContent=tr(statusMessage);
    try{const result=await fetchComparison(gen,expected,signal);if(!stillCurrent(gen,expected))return;if(!result.ok){statusMessage=result.changed?'changed':result.errorKey;statusNode.textContent=tr(statusMessage);return;}snapshot={local:result.local,cloud:result.cloud,comparison:result.comparison};renderCounts(result.comparison,result.local.trips.length);statusMessage='';statusNode.textContent='';}
    catch(_){if(stillCurrent(gen,expected)&&!signal.aborted){statusMessage='error';statusNode.textContent=tr(statusMessage);}}
    finally{if(stillCurrent(gen,expected)){busy=false;refreshButton.disabled=false;if(snapshot)renderCounts(snapshot.comparison,snapshot.local.trips.length);}}
  }
  async function runMigration() {
    if(busy)return;if(!backupCheck.checked){statusMessage='consentRequired';statusNode.textContent=tr(statusMessage);return;}if(!currentUser?.id||!snapshot||snapshot.comparison.counts.fresh===0)return;
    const expected=currentIdentity,consentedSnapshot=snapshot,consentedFresh=consentedSnapshot.comparison.records.filter(record=>record.category==='fresh').map(record=>record.trip.id).sort(),gen=++generation;
    if(controller)controller.abort();controller=new AbortController();const signal=controller.signal;busy=true;submitButton.disabled=true;refreshButton.disabled=true;statusMessage='working';statusNode.textContent=tr(statusMessage);
    const run={success:0,failed:0,attempted:0,errorKey:''};
    try{
      // Re-read immediately before writing; changed local payloads or a changed candidate set require fresh consent.
      const preflight=await fetchComparison(gen,expected,signal);if(!stillCurrent(gen,expected))return;
      if(!preflight.ok){run.errorKey=preflight.changed?'changed':'error';lastRun=run;renderRun(run);return;}
      const candidates=preflight.comparison.records.filter(record=>record.category==='fresh');
      const currentFresh=candidates.map(record=>record.trip.id).sort();
      if(preflight.local.raw!==consentedSnapshot.local.raw||canonical(currentFresh)!==canonical(consentedFresh)){
        snapshot={local:preflight.local,cloud:preflight.cloud,comparison:preflight.comparison};backupCheck.checked=false;statusMessage='changedPreview';statusNode.textContent=tr(statusMessage);renderCounts(preflight.comparison,preflight.local.trips.length);return;
      }
      snapshot={local:preflight.local,cloud:preflight.cloud,comparison:preflight.comparison};renderCounts(preflight.comparison,preflight.local.trips.length);
      if(!candidates.length){lastRun={success:0,failed:0,attempted:0};renderRun(lastRun);return;}
      statusMessage='inserting';statusNode.textContent=tr(statusMessage);
      for(const record of candidates){
        if(!stillCurrent(gen,expected)||signal.aborted)return;
        run.attempted++;
        const response=await auth.insertCloudImportTrip(currentUser.id,record.trip,true,signal);
        if(!stillCurrent(gen,expected)||signal.aborted)return;
        if(response?.reason==='accountChanged'){run.errorKey='changed';lastRun=run;renderRun(run);return;}
      }
      statusMessage='verifying';statusNode.textContent=tr(statusMessage);
      const verify=await fetchComparison(gen,expected,signal);if(!stillCurrent(gen,expected))return;
      if(!verify.ok){run.errorKey=verify.changed?'changed':'error';run.failed=candidates.length;lastRun=run;renderRun(run);return;}
      snapshot={local:verify.local,cloud:verify.cloud,comparison:verify.comparison};renderCounts(verify.comparison,verify.local.trips.length);
      const sameIds=new Set(verify.comparison.records.filter(record=>record.category==='same').map(record=>record.trip.id));
      run.success=candidates.filter(record=>sameIds.has(record.trip.id)).length;run.failed=candidates.length-run.success;run.attempted=candidates.length;lastRun=run;renderRun(run);
    }catch(_){if(!stillCurrent(gen,expected)||signal.aborted)return;run.failed=Math.max(run.failed,run.attempted);run.errorKey='error';lastRun=run;renderRun(run);}
    finally{if(stillCurrent(gen,expected)){busy=false;refreshButton.disabled=false;if(snapshot)renderCounts(snapshot.comparison,snapshot.local.trips.length);}}
  }
  button.addEventListener('click',()=>{if(!currentUser?.id)return;updateText();if(!dialog.open)dialog.showModal();refreshPreview();});
  dialog.querySelectorAll('[data-migration-close]').forEach(node=>node.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{if(controller)controller.abort();generation++;busy=false;refreshButton.disabled=false;if(snapshot)renderCounts(snapshot.comparison,snapshot.local.trips.length);});
  backupCheck.addEventListener('change',()=>{if(snapshot)renderCounts(snapshot.comparison,snapshot.local.trips.length);if(statusMessage==='consentRequired'){statusMessage='';statusNode.textContent='';}});
  refreshButton.addEventListener('click',refreshPreview);submitButton.addEventListener('click',runMigration);
  document.addEventListener('change',event=>{if(event.target?.id==='packmateLanguageSelect')updateText();});
  auth.subscribe(state=>{const next=state.user,nextIdentity=identity(next);if(nextIdentity!==currentIdentity)resetForAccount(next);else currentUser=next;button.hidden=state.status!=='ready'||!currentUser?.id;accountNode.textContent=currentUser?.email||currentUser?.id||'—';updateText();});
  updateText();
})();
