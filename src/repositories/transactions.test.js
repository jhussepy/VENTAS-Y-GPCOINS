import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(()=>({ docs:new Map(), writes:[], fail:false }));
vi.mock('../lib/firebase.js',()=>({db:{}}));
vi.mock('firebase/firestore',()=>{
  const snap=path=>({ exists:()=>m.docs.has(path), data:()=>m.docs.get(path) });
  const refs=(_db,...parts)=>parts.join('/');
  return { doc:refs, collection:refs, getDocFromServer:async ref=>snap(ref),
    getDocsFromServer:async ref=>({ docs:[...m.docs].filter(([path])=>path.startsWith(ref+'/') && path.split('/').length===ref.split('/').length+1).map(([path,value])=>({id:path.split('/').at(-1),data:()=>value})) }),
    runTransaction:async (_db, fn)=>{
      const writes=[];
      const result=await fn({get:async ref=>snap(ref),set:(ref,data,options)=>writes.push({ref,data,options}),delete:ref=>writes.push({ref,remove:true})});
      if(m.fail) throw new Error('Transacción rechazada');
      for(const w of writes) { if(w.remove)m.docs.delete(w.ref); else m.docs.set(w.ref,w.options ? {...m.docs.get(w.ref),...w.data}:w.data); }
      m.writes=writes; return result;
    },
  };
});
import { guardarOperacionUsuario, migrarUsuarioAV2, cargarDatosCoherentes } from './userDataRepository.js';
const root='usuarios/u';
beforeEach(()=>{m.docs=new Map([[root,{versionEsquema:2,revision:0}]]);m.writes=[];m.fail=false;});
describe('transacciones de datos',()=>{
  it('restauración v2 se aplica entera o no se aplica',async()=>{
    m.docs.set(root+'/ventasVodafone/v',{id:'v',nombre:'Ana'});m.fail=true;
    const op={changes:{ventas:{before:[{id:'v',nombre:'Ana'}],after:[{id:'nuevo'}]},agendados:{before:[],after:[{id:'agenda'}]}}};
    await expect(guardarOperacionUsuario('u',op)).rejects.toThrow('rechazada');
    expect(m.docs.get(root+'/ventasVodafone/v').nombre).toBe('Ana');expect(m.docs.has(root+'/agendados/agenda')).toBe(false);
    m.fail=false;await guardarOperacionUsuario('u',op);
    expect(m.docs.has(root+'/ventasVodafone/v')).toBe(false);expect(m.docs.has(root+'/agendados/agenda')).toBe(true);expect(m.docs.get(root).revision).toBe(1);
  });
  it('v1 preserva una venta creada por otra sesión',async()=>{
    m.docs.set(root,{ventas:[{id:'remoto'}],versionEsquema:1});
    await guardarOperacionUsuario('u',{changes:{ventas:{before:[],after:[{id:'local'}]}}});
    expect(m.docs.get(root).ventas.map(v=>v.id)).toEqual(['remoto','local']);
  });
  it('los mapas eliminan claves sin conservar objetivos antiguos',async()=>{
    m.docs.set(root,{objetivosLogros:{a:2,b:3},versionEsquema:1});
    await guardarOperacionUsuario('u',{changes:{objetivosLogros:{before:{a:2,b:3},after:{b:3}}}});
    expect(m.docs.get(root).objetivosLogros).toEqual({b:3});
  });
  it('conflicto sobre el mismo campo aborta todas las escrituras',async()=>{
    m.docs.set(root+'/ventasVodafone/a',{id:'a',nombre:'Eva'});
    await expect(guardarOperacionUsuario('u',{changes:{ventas:{before:[{id:'a',nombre:'Ana'}],after:[{id:'a',nombre:'Luz'},{id:'nuevo'}]}}})).rejects.toThrow('Conflicto');
    expect(m.writes).toHaveLength(0);expect(m.docs.has(root+'/ventasVodafone/nuevo')).toBe(false);
  });
  it('migración transfiere contenidos completos y elimina arrays legacy atómicamente',async()=>{
    const datos={ventas:[{id:'a',lineasMoviles:[{id:'l',activa:true}]}],ventasLowi:[],agendados:[]};m.docs.set(root,{...datos,revision:2});
    const result=await migrarUsuarioAV2('u',datos);
    expect(result.versionEsquema).toBe(2);expect(m.docs.get(root).ventas).toBeUndefined();expect(m.docs.get(root+'/ventasVodafone/a')).toEqual(datos.ventas[0]);
    expect((await cargarDatosCoherentes('u')).ventas).toEqual(datos.ventas);
  });
  it('la migración compara contenido, no solo IDs',async()=>{
    m.docs.set(root,{ventas:[{id:'a',lineasMoviles:[{activa:false}]}],revision:0});
    await expect(migrarUsuarioAV2('u',{ventas:[{id:'a',lineasMoviles:[{activa:true}]}],ventasLowi:[],agendados:[]})).rejects.toThrow('no coincide');expect(m.writes).toHaveLength(0);
  });
  it('rechaza más de 400 cambios antes de escribir',async()=>{
    await expect(guardarOperacionUsuario('u',{changes:{ventas:{before:[],after:Array.from({length:401},(_,i)=>({id:String(i)}))}}})).rejects.toThrow('400');expect(m.writes).toHaveLength(0);
  });
});
