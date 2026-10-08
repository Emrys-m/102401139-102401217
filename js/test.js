/* 单元测试：浏览器打开 test.html 运行 */
(function () {
  'use strict';
  let passed = 0, failed = 0;
  const results = [];
  function assert(cond, name, detail) {
    if (cond) { passed++; results.push({name, ok:true, detail:detail||''}); }
    else { failed++; results.push({name, ok:false, detail:detail||''}); }
  }
  function eq(a,b,n) { assert(JSON.stringify(a)===JSON.stringify(b), n, `期望=${JSON.stringify(b)} 实际=${JSON.stringify(a)}`); }

  const sample = [
    { id:'1', type:'lost',  emoji:'💳', title:'蓝色校园卡', desc:'尾号8821', place:'第一食堂', time:'09-27 13:50', contact:'wx1', status:'open',  owner:'' },
    { id:'2', type:'found', emoji:'🎧', title:'白色耳机',   desc:'AirPods',     place:'图书馆',   time:'09-27 11:20', contact:'wx2', status:'open',  owner:'' },
    { id:'3', type:'lost',  emoji:'☂️', title:'黑色雨伞',   desc:'长柄黑伞',   place:'运动场',   time:'09-26 18:30', contact:'wx3', status:'done',  owner:'' }
  ];

  eq(validateItem({title:'', place:'x', time:'t', contact:'c'}).valid, false, 'T1 空名称应报错');
  eq(validateItem({title:'x', place:'', time:'t', contact:'c'}).valid, false, 'T2 空地点应报错');
  eq(validateItem({title:'x', place:'x', time:'', contact:'c'}).valid, false, 'T3 空时间应报错');
  eq(validateItem({title:'x', place:'x', time:'t', contact:''}).valid, false, 'T4 空联系方式应报错');
  eq(validateItem({title:'x', place:'x', time:'t', contact:'c'}).valid, true,  'T5 合法数据应通过');

  eq(searchItems(sample,'校园卡').length, 1, 'T6 按名称搜索');
  eq(searchItems(sample,'airpods').length, 1, 'T7 大小写不敏感');
  eq(searchItems(sample,'图书馆').length, 1, 'T8 按地点搜索');
  eq(searchItems(sample,'').length, 0,      'T9 空关键词返回空');
  eq(searchItems(sample,'不存在xyz').length, 0, 'T10 无匹配返回空');

  eq(filterByType(sample,'lost').length, 2, 'T11 筛寻物');
  eq(filterByType(sample,'found').length, 1, 'T12 筛招领');
  eq(filterByType(sample,'all').length, 3, 'T13 all返回全部');

  const s = new Set();
  for (let i=0;i<100;i++) s.add(genId());
  eq(s.size, 100, 'T14 100个ID唯一');

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    const it = addItem({type:'lost', emoji:'🔑', title:'测试钥匙', place:'操场', time:'10-01', contact:'wx_test'});
    assert(loadItems().some(x => x.id === it.id), 'T15 addItem后能读到');
    eq(loadItems().find(x=>x.id===it.id).status, 'open', 'T16 新条目状态open');
    assert(updateStatus(it.id,'done') === true, 'T17 updateStatus成功');
    eq(loadItems().find(x=>x.id===it.id).status, 'done', 'T18 状态已变done');
    assert(updateStatus('notexist','done') === false, 'T19 不存在id返回false');
    localStorage.removeItem(STORAGE_KEY);
  }

  const summary = document.getElementById('summary');
  const resEl = document.getElementById('results');
  const total = passed + failed;
  summary.className = failed===0 ? 'summary pass' : 'summary fail';
  summary.textContent = `共 ${total} 个用例：✅ 通过 ${passed}，❌ 失败 ${failed}`;
  results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'test-case ' + (r.ok?'pass':'fail');
    div.innerHTML = `<div class="test-name"><span class="tag ${r.ok?'pass':'fail'}">${r.ok?'PASS':'FAIL'}</span>${r.name}</div>${r.detail?`<div class="test-detail">${r.detail}</div>`:''}`;
    resEl.appendChild(div);
  });
})();
