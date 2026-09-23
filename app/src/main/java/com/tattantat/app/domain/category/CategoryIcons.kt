package com.tattantat.app.domain.category

import android.content.Context
import androidx.annotation.DrawableRes
import com.tattantat.app.R

object CategoryIcons {
    @DrawableRes
    fun getSubCategoryDrawableRes(context: Context, slugOrId: String): Int {
        val cleanSlug = slugOrId.lowercase().trim().replace("_", "-")
        val directRes = when (cleanSlug) {
            "1", "13", "14", "15", "16", "dien-thoai", "iphone", "samsung", "xiaomi", "oppo" -> R.drawable.sub_dien_thoai
            "2", "17", "18", "19", "20", "21", "laptop", "macbook", "dell", "hp", "lenovo", "asus" -> R.drawable.sub_laptop
            "28", "may-tinh-bang" -> R.drawable.sub_may_tinh_bang
            "29", "may-tinh-de-ban" -> R.drawable.sub_may_tinh_de_ban
            "30", "31", "may-anh", "may-quay" -> R.drawable.sub_may_anh_may_quay
            "32", "33", "tv", "thiet-bi-am-thanh" -> R.drawable.sub_tv_am_thanh
            "34", "phu-kien-cong-nghe", "phu-kien-tech" -> R.drawable.sub_phu_kien_tech
            "35", "71", "72", "73", "may-choi-game", "thiet-bi-choi-game" -> R.drawable.sub_thiet_bi_choi_game
            "36", "dong-ho-thong-minh", "thiet-bi-deo-thong-minh" -> R.drawable.sub_thiet_bi_deo_thong_minh

            "24", "xe-may" -> R.drawable.sub_xe_may
            "38", "42", "o-to", "xe-ban-tai" -> R.drawable.sub_o_to
            "44", "xe-dap" -> R.drawable.sub_xe_dap
            "41", "xe-tai", "xe-tai-chuyen-dung" -> R.drawable.sub_xe_tai_chuyen_dung
            "45", "phu-tung-xe", "phu-tung-phu-kien-xe" -> R.drawable.sub_phu_tung_phu_kien_xe

            "47", "ban-nha", "nha-o" -> R.drawable.sub_nha_o
            "48", "ban-dat", "dat" -> R.drawable.sub_dat
            "49", "can-ho", "can-ho-chung-cu" -> R.drawable.sub_can_ho_chung_cu
            "50", "phong-tro" -> R.drawable.sub_phong_tro
            "51", "52", "cho-thue-nha", "cho-thue-mat-bang", "mat-bang-kinh-doanh" -> R.drawable.sub_mat_bang_kinh_doanh
            "53", "van-phong" -> R.drawable.sub_van_phong
            "54", "bds-khac", "bat-dong-san-khac" -> R.drawable.sub_bds_khac

            "56", "57", "58", "59", "sofa", "ban-ghe", "tu", "giuong", "noi-that" -> R.drawable.sub_noi_that
            "60", "61", "62", "tu-lanh", "may-giat", "dieu-hoa", "dien-lanh" -> R.drawable.sub_dien_lanh
            "63", "thiet-bi-nha-bep", "bep-dien-nha-bep" -> R.drawable.sub_bep_dien_nha_bep

            "65", "quan-ao", "quan-ao-nam", "quan-ao-nu" -> R.drawable.sub_quan_ao_nam
            "66", "giay-dep" -> R.drawable.sub_giay_dep
            "67", "tui-xach", "tui-xach-balo-vali" -> R.drawable.sub_tui_xach_balo_vali
            "68", "dong-ho", "thoi-trang-dong-ho" -> R.drawable.sub_dong_ho
            "69", "phu-kien-thoi-trang" -> R.drawable.sub_phu_kien_thoi_trang

            "93", "cho" -> R.drawable.sub_cho
            "94", "meo" -> R.drawable.sub_meo
            "95", "ca-canh" -> R.drawable.sub_ca_canh

            else -> 0
        }
        if (directRes != 0) return directRes

        val resName = "sub_" + cleanSlug.replace("-", "_")
        val identifier = context.resources.getIdentifier(resName, "drawable", context.packageName)
        if (identifier != 0) return identifier

        return getDrawableRes(slugOrId, isSubCategory = true)
    }

    @DrawableRes
    fun getDrawableRes(categoryIdOrSlug: String, isSubCategory: Boolean = false): Int {
        val key = categoryIdOrSlug.lowercase().trim().replace("_", "-")
        if (isSubCategory) {
            return when (key) {
                "1", "13", "14", "15", "16", "dien-thoai", "iphone", "samsung", "xiaomi", "oppo" -> R.drawable.card_do_cong_nghe
                "2", "17", "18", "19", "20", "21", "laptop", "macbook", "dell", "hp", "lenovo", "asus" -> R.drawable.card_do_cong_nghe
                "24", "xe-may" -> R.drawable.card_xe_co
                "38", "o-to" -> R.drawable.card_xe_co
                "47", "ban-nha", "nha-o" -> R.drawable.card_nha_dat
                "48", "ban-dat", "dat" -> R.drawable.card_nha_dat
                "49", "can-ho" -> R.drawable.card_nha_dat
                "65", "quan-ao" -> R.drawable.card_thoi_trang_ca_nhan
                "66", "giay-dep" -> R.drawable.card_thoi_trang_ca_nhan
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
