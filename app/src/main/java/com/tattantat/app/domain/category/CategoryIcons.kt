package com.tattantat.app.domain.category

import androidx.annotation.DrawableRes
import com.tattantat.app.R

object CategoryIcons {
    /**
     * Resolves the 3D drawable icon resource for a category ID or slug.
     */
    @DrawableRes
    fun getDrawableRes(categoryIdOrSlug: String): Int {
        val key = categoryIdOrSlug.lowercase().trim().replace("_", "-")
        return when (key) {
            "6", "54", "47", "48", "49", "50", "51", "52", "53", "nha-dat", "bat-dong-san", "property", "can-ho-chung-cu", "nha-o", "dat", "phong-tro", "van-phong", "mat-bang-kinh-doanh", "kho-xuang", "bds-khac", "ban-nha", "ban-dat", "can-ho", "cho-thue-nha", "cho-thue-mat-bang" -> R.drawable.cat_nha_dat
            "5", "24", "38", "40", "41", "42", "43", "44", "45", "xe-co", "vehicle", "vehicles", "o-to", "xe-may", "xe-dap", "xe-tai-chuyen-dung", "phu-tung-phu-kien-xe", "phu-tung-xe", "xe-ban-tai", "xe-khach", "xe-dien", "phuong-tien-khac" -> R.drawable.cat_xe_co
            "25", "1", "2", "13", "14", "15", "16", "17", "18", "19", "20", "21", "28", "29", "30", "31", "32", "33", "34", "35", "36", "do-cong-nghe", "phones", "tech", "technology", "dien-thoai", "may-tinh-bang", "laptop", "macbook", "dell", "hp", "lenovo", "asus", "iphone", "samsung", "xiaomi", "oppo", "may-tinh-de-ban", "may-anh", "may-quay", "tv", "thiet-bi-am-thanh", "phu-kien-cong-nghe", "may-choi-game", "dong-ho-thong-minh" -> R.drawable.cat_do_cong_nghe
            "3", "56", "57", "58", "59", "60", "61", "62", "63", "nha-cua-doi-song", "do-gia-dung", "home", "dien-lanh", "sofa", "ban-ghe", "tu", "giuong", "tu-lanh", "may-giat", "dieu-hoa", "thiet-bi-nha-bep" -> R.drawable.cat_nha_cua_doi_song
            "4", "65", "66", "67", "68", "69", "thoi-trang-ca-nhan", "thoi-trang", "fashion", "quan-ao", "giay-dep", "tui-xach", "thoi-trang-dong-ho", "phu-kien-thoi-trang" -> R.drawable.cat_thoi_trang_ca_nhan
            "10", "80", "me-va-be", "mother-baby", "mother_baby", "do-dung-hoc-tap" -> R.drawable.cat_me_va_be
            "8", "7", "71", "72", "73", "74", "75", "the-thao-giai-tri", "the-thao", "sports", "playstation", "xbox", "nintendo", "dung-cu-the-thao", "nhac-cu", "do-choi" -> R.drawable.cat_the_thao_giai_tri
            "9", "78", "79", "sach-van-phong-pham", "sach", "giao-trinh" -> R.drawable.cat_the_thao_giai_tri
            "92", "93", "94", "95", "thu-cung", "thu-cung-canh", "phu-kien-thu-cung", "thuc-an-thu-cung", "pets" -> R.drawable.cat_thu_cung
            "98", "99", "100", "101", "102", "103", "104", "dich-vu", "services", "sua-chua", "van-chuyen", "thiet-ke", "cho-thue", "dich-vu-ca-nhan", "dich-vu-doanh-nghiep" -> R.drawable.cat_dich_vu
            "thuc-pham", "food" -> R.drawable.cat_thuc_pham
            "81", "82", "83", "84", "85", "may-moc-cong-nghiep", "may-moc-cong-cu", "may-moc-nghiep", "dung-cu", "thiet-bi-xay-dung", "thiet-bi-dien" -> R.drawable.cat_may_moc_cong_nghiep
            "86", "87", "88", "89", "90", "91", "do-suu-tam", "suu-tam-dong-ho", "do-co", "mo-hinh", "tem", "vat-pham-suu-tam" -> R.drawable.cat_the_thao_giai_tri
            "tang-mien-phi", "giveaway", "free" -> R.drawable.cat_tang_mien_phi
            else -> R.drawable.cat_khac
        }
    }
}
