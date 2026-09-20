package com.tattantat.app.presentation.sell.dynamic

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.tattantat.app.data.remote.listing.*
import org.junit.Assert.*
import org.junit.Test

class ListingRulesTest {
    private fun field(key:String="value",type:String="text",config:FieldConfig=FieldConfig(),required:Boolean=true)=
        ListingField(key,key,type,required,options=listOf(FieldOption("a","A"),FieldOption("b","B")),config=config)
    private fun template(vararg fields:ListingField)=ListingTemplate("template","12",7,"Dynamic",fields.toList(),TemplateConfig(listOf("FIXED","FREE","CONTACT")))
    private fun data(values:Map<String,Any?> = emptyMap())=ListingFormData(
        title="Điện thoại",description="Mô tả sản phẩm",price="9999999999999",images=listOf("image-id"),
        location=ListingLocation(province="Test",ward="Test"),contact=ListingContact("Test","0901234567"),values=values)

    @Test fun exactMoneyAndFreeMode(){
        assertFalse(ListingRules.errors(data(),template(),5).containsKey("price"))
        assertEquals("9.999.999.999.999 đ",ListingRules.price(data()))
        assertTrue(ListingRules.errors(data().copy(price="1.5"),template(),5).containsKey("price"))
        assertFalse(ListingRules.errors(data().copy(price="",priceMode="FREE"),template(),5).containsKey("price"))
    }
    @Test fun conditionalChildrenFollowParentVisibility(){
        val parent=field("choice","select")
        val child=field("child",config=FieldConfig(visibleWhen=VisibilityRule("choice","eq","a")))
        val grandchild=field("nested",config=FieldConfig(visibleWhen=VisibilityRule("child","ne","no")))
        val schema=template(parent,child,grandchild)
        assertFalse(ListingRules.visible(grandchild,mapOf("choice" to "b","child" to "yes"),schema.fields))
        assertFalse(ListingRules.errors(data(mapOf("choice" to "b")),schema,5).containsKey("values.child"))
        assertTrue(ListingRules.errors(data(mapOf("choice" to "a")),schema,5).containsKey("values.child"))
    }
    @Test fun numericConditionsSurviveMoshiDoubles(){
        val fields=listOf(field("number","number"),field(config=FieldConfig(visibleWhen=VisibilityRule("number","in",listOf(1.0,2.0)))))
        assertTrue(ListingRules.visible(fields.last(),mapOf("number" to 1),fields))
    }
    @Test fun cyclicOrDisabledConditionsFailClosed(){
        val a=field("a",config=FieldConfig(visibleWhen=VisibilityRule("b","eq","yes")))
        val b=field("b",config=FieldConfig(visibleWhen=VisibilityRule("a","eq","yes")))
        assertFalse(ListingRules.visible(a,mapOf("a" to "yes","b" to "yes"),listOf(a,b)))
        assertFalse(ListingRules.visible(field().copy(enabled=false),emptyMap(),listOf(field())))
    }
    @Test fun falseIsValidRequiredBoolean(){
        assertFalse(ListingRules.errors(data(mapOf("value" to false)),template(field(type="boolean")),1).containsKey("values.value"))
        assertTrue(ListingRules.errors(data(),template(field(type="boolean")),1).containsKey("values.value"))
    }
    @Test fun typedValidationAndMediaReferences(){
        for((type,value) in listOf("number" to 12.5,"currency" to "9999999999999","date" to "2024-02-29","select" to "a","multi-select" to listOf("a"),"image" to "image-id")){
            assertFalse(type,ListingRules.errors(data(mapOf("value" to value)),template(field(type=type)),5).containsKey("values.value"))
        }
        for((type,value) in listOf("number" to Double.NaN,"number" to 1e14,"year" to 2025.5,"date" to "2025-02-29","currency" to 100.0,"image" to "foreign-id","multi-select" to listOf("unknown"))){
            assertTrue(type,ListingRules.errors(data(mapOf("value" to value)),template(field(type=type)),5).containsKey("values.value"))
        }
    }
    @Test fun mediaRequirementsOnlyBlockMediaOrPublishStep(){
        val d=data().copy(images=emptyList())
        assertFalse(ListingRules.errors(d,template(),1).containsKey("images"))
        assertTrue(ListingRules.errors(d,template(),2).containsKey("images"))
        assertTrue(ListingRules.errors(d,template(),5).containsKey("images"))
    }
    @Test fun coordinatesAreFinitePairedAndZeroIsValid(){
        assertTrue(ListingRules.validPoint(0.0,0.0))
        assertTrue(ListingRules.validPoint(-85.0,180.0))
        for(pair in listOf(null to 0.0,0.0 to null,Double.NaN to 0.0,0.0 to Double.POSITIVE_INFINITY,86.0 to 0.0,0.0 to -181.0))assertFalse(ListingRules.validPoint(pair.first,pair.second))
        assertTrue(ListingRules.errors(data().copy(location=ListingLocation("Test",ward="Test",latitude=10.0)),template(),3).containsKey("location"))
    }
    @Test fun pinnedTemplateDefaultsParseSparseServerDraft(){
        val moshi=Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
        val json="""{"id":"draft","categoryId":"12","revision":0,"status":"DRAFT","owner":true,"template":{"id":"v7","categoryId":"12","version":7,"name":"Test","fields":[],"config":{"priceModes":["CONTACT"]}},"data":{"values":{},"images":[],"videos":[],"priceMode":"CONTACT","condition":"USED_GOOD","location":{"hideExact":true}},"media":[]}"""
        val draft=moshi.adapter(ListingDraft::class.java).fromJson(json)!!
        assertEquals(7,draft.template.version)
        assertEquals("",draft.data.contact.phone)
        assertTrue(draft.data.location.hideExact)
        assertNull(draft.data.location.latitude)
        val serialized=moshi.adapter(SaveDraft::class.java).toJson(SaveDraft(2,data()))
        assertTrue(serialized.contains("\"price\":\"9999999999999\""))
        assertFalse(serialized.contains("latitude"))
        assertTrue(serialized.contains("\"revision\":2"))
    }
}
