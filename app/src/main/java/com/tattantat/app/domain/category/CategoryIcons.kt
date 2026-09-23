package com.tattantat.app.domain.category

import android.content.Context
import androidx.annotation.DrawableRes
import com.tattantat.app.R

object CategoryIcons {
    @DrawableRes
    fun getSubCategoryDrawableRes(context: Context, slugOrId: String): Int {
        val cleanSlug = slugOrId.lowercase().trim().replace("-", "_")
        val resId = context.resources.getIdentifier("sub_$cleanSlug", "drawable", context.packageName)
        if (resId != 0) return resId
        return getDrawableRes(slugOrId, isSubCategory = true)
    }

    @DrawableRes
    fun getDrawableRes(categoryIdOrSlug: String, isSubCategory: Boolean = false): Int {
        val key = categoryIdOrSlug.lowercase().trim().replace("_", "-")
        if (isSubCategory) {
            return when (key) {
                "1", "13", "14", "15", "16", "dien-thoai", "iphone", "samsung", "xiaomi", "oppo" -> R.drawable.card_do_cong_nghe
                "2", "17", "18", "19", "20", "21", "laptop", "macbook", "dell", "hp", "lenovo", "asus" -> R.drawable.card_do_cong_nghe
                "28", "29", "may-tinh-bang", "may-tinh-de-ban" -> R.drawable.card_do_cong_nghe
                "30", "31", "may-anh", "may-quay" -> R.drawable.card_do_cong_nghe
                "32", "33", "34", "35", "36", "tv", "thiet-bi-am-thanh", "phu-kien-cong-nghe", "may-choi-game", "dong-ho-thong-minh" -> R.drawable.card_do_cong_nghe
                
                "24", "xe-may" -> R.drawable.card_xe_co
                "38", "o-to" -> R.drawable.card_xe_co
                "44", "xe-dap" -> R.drawable.card_xe_co
                "40", "41", "42", "43", "45", "xe-dien", "xe-tai", "xe-ban-tai", "xe-khach", "phu-tung-xe" -> R.drawable.card_xe_co
                
                "47", "ban-nha" -> R.drawable.card_nha_dat
                "48", "ban-dat" -> R.drawable.card_nha_dat
                "49", "can-ho" -> R.drawable.card_nha_dat
                "50", "phong-tro" -> R.drawable.card_nha_dat
                "51", "52", "53", "54", "cho-thue-nha", "cho-thue-mat-bang", "van-phong", "bat-dong-san-khac" -> R.drawable.card_nha_dat

                "56", "sofa" -> R.drawable.card_nha_cua_doi_song
                "57", "ban-ghe" -> R.drawable.card_nha_cua_doi_song
                "58", "tu" -> R.drawable.card_nha_cua_doi_song
                "59", "giuong" -> R.drawable.card_nha_cua_doi_song
                "60", "61", "62", "63", "tu-lanh", "may-giat", "dieu-hoa", "thiet-bi-nha-bep" -> R.drawable.card_nha_cua_doi_song

                "65", "quan-ao" -> R.drawable.card_thoi_trang_ca_nhan
                "66", "giay-dep" -> R.drawable.card_thoi_trang_ca_nhan
                "67", "tui-xach" -> R.drawable.card_thoi_trang_ca_nhan
                "68", "69", "thoi-trang-dong-ho", "phu-kien-thoi-trang" -> R.drawable.card_thoi_trang_ca_nhan

                "7", "71", "72", "73", "74", "75", "do-choi", "playstation", "xbox", "nintendo", "dung-cu-the-thao", "nhac-cu" -> R.drawable.card_the_thao_giai_tri
                "78", "79", "80", "sach", "giao-trinh", "do-dung-hoc-tap" -> R.drawable.card_the_thao_giai_tri
                "93", "94", "95", "thu-cung-canh", "phu-kien-thu-cung", "thuc-an-thu-cung" -> R.drawable.card_thu_cung
                "99", "100", "101", "102", "103", "104", "sua-chua", "van-chuyen", "thiet-ke", "cho-thue", "dich-vu-ca-nhan", "dich-vu-doanh-nghiep" -> R.drawable.card_dich_vu
                "82", "83", "84", "85", "may-moc-cong-nghiep", "dung-cu", "thiet-bi-xay-dung", "thiet-bi-dien" -> R.drawable.card_may_moc_cong_nghiep
                "87", "88", "89", "90", "91", "suu-tam-dong-ho", "do-co", "mo-hinh", "tem", "vat-pham-suu-tam" -> R.drawable.card_the_thao_giai_tri
                else -> R.drawable.card_khac
            }
        }

        return when (key) {
            "6", "nha-dat", "bat-dong-san", "property" -> R.drawable.cat_nha_dat
            "5", "xe-co", "vehicle", "vehicles" -> R.drawable.cat_xe_co
            "25", "11", "do-cong-nghe", "do-dien-tu", "phones", "tech", "technology" -> R.drawable.cat_do_cong_nghe
            "3", "nha-cua-doi-song", "do-gia-dung", "home" -> R.drawable.cat_nha_cua_doi_song
            "4", "thoi-trang-ca-nhan", "thoi-trang", "fashion" -> R.drawable.cat_thoi_trang_ca_nhan
            "10", "me-va-be", "mother-baby", "mother_baby" -> R.drawable.cat_me_va_be
            "8", "the-thao-giai-tri", "the-thao", "sports" -> R.drawable.cat_the_thao_giai_tri
            "9", "sach-van-phong-pham", "sach-hoc-tap", "sach" -> R.drawable.cat_sach_hoc_tap
            "92", "thu-cung", "pets" -> R.drawable.cat_thu_cung
            "98", "dich-vu", "services" -> R.drawable.cat_dich_vu
            "thuc-pham", "food" -> R.drawable.cat_thuc_pham
            "81", "may-moc-cong-nghiep", "may-moc-cong-cu", "machinery" -> R.drawable.cat_may_moc_cong_nghiep
            "86", "do-suu-tam" -> R.drawable.cat_do_suu_tam
            "12", "hang-hoa-khac", "khac" -> R.drawable.cat_khac
            "tang-mien-phi", "giveaway", "free" -> R.drawable.cat_tang_mien_phi
            else -> R.drawable.cat_khac
        }
    }
}
