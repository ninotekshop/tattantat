package com.tattantat.app.domain.category

import androidx.annotation.DrawableRes
import com.tattantat.app.R

object CategoryIcons {
    /**
     * Resolves the 3D drawable icon resource for a category ID or slug.
     */
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
