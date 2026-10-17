import {test} from 'node:test'
import assert from 'node:assert/strict'
import {emptyApplicationForm,applicationFormRequest} from '../src/features/sellerCampaigns/applicationFormModel.js'
test('허용 유형과 동의문을 자동 생성하지 않습니다',()=>{
 const blank=emptyApplicationForm()
 assert.deepEqual(blank,{allowedFulfillmentTypes:[],questions:[],agreements:[]})
 assert.throws(()=>applicationFormRequest(blank))
 assert.throws(()=>applicationFormRequest({...blank,allowedFulfillmentTypes:['UNKNOWN']}))
})
test('브랜드가 입력한 문서 본문·버전·필수 여부를 그대로 전달합니다',()=>{
 const agreement={id:'explicit-test',title:'명시적 테스트 문서',version:'test-v1',body:'이 내용은 모델 검증용 데이터입니다.',required:false}
 const result=applicationFormRequest({allowedFulfillmentTypes:['VISIT'],questions:[],agreements:[agreement]})
 assert.deepEqual(result.agreements,[agreement])
 assert.deepEqual(result.allowedFulfillmentTypes,['VISIT'])
})
test('불완전 문서와 중복 식별자, 비어 있는 질문을 저장하지 않습니다',()=>{
 const base={allowedFulfillmentTypes:['VISIT'],questions:[],agreements:[]}
 const agreement={id:'id',title:'테스트',version:'v1',body:'테스트 본문',required:false}
 assert.throws(()=>applicationFormRequest({...base,agreements:[{...agreement,body:''}]}))
 assert.throws(()=>applicationFormRequest({...base,agreements:[agreement,agreement]}))
 assert.throws(()=>applicationFormRequest({...base,questions:[{id:'q',label:'',type:'TEXT',options:[]}]}))
})
test('단일선택 문항의 빈 선택지·중복 선택지·잘못된 길이를 거부합니다',()=>{
 const base={allowedFulfillmentTypes:['DELIVERY'],questions:[],agreements:[]}
 const question={id:'q',label:'질문',type:'SINGLE_CHOICE',options:['A','B'],required:true,maxLength:null}
 for(const options of [[],[''],['A','A']]) assert.throws(()=>applicationFormRequest({...base,questions:[{...question,options}]}))
 assert.throws(()=>applicationFormRequest({...base,questions:[{...question,type:'TEXT',maxLength:'0'}]}))
 assert.deepEqual(applicationFormRequest({...base,questions:[question]}).questions[0].options,['A','B'])
})
