// Validation runs in the editor before a content commit is created.
if(window.CMS){
  CMS.registerEventListener({name:'preSave',handler:({entry})=>{
    const data=entry.get('data');const categories=data.get('categories');
    if(categories){const ids=categories.map(item=>item.get('id')).toArray();if(new Set(ids).size!==ids.length)throw new Error('ID категорий должны быть уникальными.');}
    return data;
  }});
}
