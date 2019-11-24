interface CartItem {
    discounted_price: 4000
    discounts?: any[]
    featured_image: {
        url: string,
        aspect_ratio: number,
        alt?: string
    }
    final_line_price: number
    final_price: number
    gift_card?: boolean
    grams?: number
    handle: string
    id: number
    image?: string
    key: string
    line_level_discount_allocations?: any[]
    line_level_total_discount: number
    line_price: number
    options_with_values: Object[]
    original_line_price: number
    original_price: number
    price: number
    product_description?: string
    product_has_only_default_variant: false
    product_id: number
    product_title: string
    product_type: string
    properties: Object
    quantity: number
    requires_shipping: Boolean
    sku: string
    taxable: Boolean
    title: string
    total_discount: number
    url: string
    variant_id: number
    variant_options: string[]
    variant_title: string
    vendor: string
}

interface Cart {
    attributes?: Object
    cart_level_discount_applications: any[]
    currency: string
    item_count: number
    items: CartItem[] | null
    items_subtotal_price: number
    note?: string
    original_total_price: number
    requires_shipping: boolean
    token: string
    total_discount: number
    total_price: number
    total_weight: number
}

export class TShopify {
    private static money_format:string = "${{amount}}";
    /**
     * a superior function to the original formatMoney(). Thanks Damiano!
     * @author Damiano_Viscard
     * @src https://community.shopify.com/c/Shopify-APIs-SDKs/Shopify-formatMoney-Alternative-version/m-p/141962
     * @param thePrice
     * @param theFormat
     */
    static formatMoney(thePrice:number, theFormat:string) {
        const formatPattern:RegExp = /\{\{\s*(\w+)\s*\}\}/;
        theFormat = (theFormat || this.money_format);
        let priceStr:string = (thePrice).toString();

        switch (priceStr.length) {
            case 0:
            priceStr = '000';
            break;

            case 1:
            priceStr = '00' + thePrice;
            break;

            case 2:
            priceStr = '0' + thePrice;
            break;

            default:
            break;
        }

        let decimalsString:string = priceStr.substr(priceStr.length - 2);
        let unitsString:string = priceStr.substr(0, priceStr.length - 2);
        let separator:string = ',';
        let decimalsSeparator:string = '.';

        function addSeparator(moneyString:string, separator:string):string {
            separator = (separator || ',');
            return moneyString.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + separator);
        }

        switch(theFormat.match(formatPattern)[1]) {
            case 'amount_no_decimals':
                decimalsString = '';
                decimalsSeparator = '';
                break;

            case 'amount_with_comma_separator':
                separator = '.';
                decimalsSeparator = ',';
                break;

            case 'amount_no_decimals_with_comma_separator':
                separator = '.';
                decimalsString = '';
                decimalsSeparator = '';
                break;

            default:
                break;
        }

        let output1 = addSeparator(unitsString, separator) + decimalsSeparator + decimalsString;
        var output2 = theFormat.replace(formatPattern, output1);
        return output2;
    }

    static resizeImage = function(imageUrl:string, size:string):string {
        try {
            if ("original" == size) return imageUrl;
            var fileSizeAndType = imageUrl.match(/(.*\/[\w\-\_\.]+)\.(\w{2,4})/);
            return fileSizeAndType[1] + "_" + size + "." + fileSizeAndType[2]
        } catch {
            return imageUrl;
        }
    }

    static async public addItem(t,r,e): Promise<CartItem|Error> {
        const options = {
            method: 'post',
            body: JSON.stringify({
                quantity: (r = r || 1),
                id: t
            })
        }

        return await fetch("/cart/add.js", options)
            .then()
            .then(cartItem => this.handleReponse(cartItem))
    };

    static async public addItemFromForm(elementId:string): Promise<CartItem|Error> {
        const form = (<HTMLFormElement>document.getElementById(`#${elementId}`));
        const options = {
            method: 'post',
            body: JSON.stringify(new FormData(form))
        }

        return await fetch("/cart/add.js", options).then(cartItem => this.handleReponse(cartItem))
    }

    static async public getCart():Promise<Response|Error> {
        return await fetch('cart.js').then().then(cart => this.handleReponse(cart));
    }

    static handleReponse(response:Response):Promise<any>|Error {
        return response.ok ? response.json() : new Error()
    }
}

Shopify.pollForCartShippingRatesForDestination = function(o, a, t) {
        t = t || Shopify.onError;
        var n = function() {
            jQuery.ajax("/cart/async_shipping_rates", {
                dataType: "json",
                success: function(t, r, e) {
                    200 === e.status ? "function" == typeof a ? a(t.shipping_rates, o) : Shopify.onCartShippingRatesUpdate(t.shipping_rates, o) : setTimeout(n, 500)
                },
                error: t
            })
        };
        return n
    }, Shopify.getCartShippingRatesForDestination = function(t, r, e) {
        e = e || Shopify.onError;
        var o = {
            type: "POST",
            url: "/cart/prepare_shipping_rates",
            data: Shopify.param({
                shipping_address: t
            }),
            success: Shopify.pollForCartShippingRatesForDestination(t, r, e),
            error: e
        };
        jQuery.ajax(o)
    }, Shopify.getProduct = function(t, r) {
        jQuery.getJSON("/products/" + t + ".js", function(t) {
            "function" == typeof r ? r(t) : Shopify.onProduct(t)
        })
    }, Shopify.changeItem = function(t, r, e) {
        var o = {
            type: "POST",
            url: "/cart/change.js",
            data: "quantity=" + r + "&id=" + t,
            dataType: "json",
            success: function(t) {
                "function" == typeof e ? e(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(o)
    }, Shopify.removeItem = function(t, r) {
        var e = {
            type: "POST",
            url: "/cart/change.js",
            data: "quantity=0&id=" + t,
            dataType: "json",
            success: function(t) {
                "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(e)
    }, Shopify.clear = function(r) {
        var t = {
            type: "POST",
            url: "/cart/clear.js",
            data: "",
            dataType: "json",
            success: function(t) {
                "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(t)
    }, Shopify.updateCartFromForm = function(t, r) {
        var e = {
            type: "POST",
            url: "/cart/update.js",
            data: jQuery("#" + t).serialize(),
            dataType: "json",
            success: function(t) {
                "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(e)
    }, Shopify.updateCartAttributes = function(t, r) {
        var o = "";
        jQuery.isArray(t) ? jQuery.each(t, function(t, r) {
            var e = attributeToString(r.key);
            "" !== e && (o += "attributes[" + e + "]=" + attributeToString(r.value) + "&")
        }) : "object" == typeof t && null !== t && jQuery.each(t, function(t, r) {
            o += "attributes[" + attributeToString(t) + "]=" + attributeToString(r) + "&"
        });
        var e = {
            type: "POST",
            url: "/cart/update.js",
            data: o,
            dataType: "json",
            success: function(t) {
                "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(e)
    }, Shopify.updateCartNote = function(t, r) {
        var e = {
            type: "POST",
            url: "/cart/update.js",
            data: "note=" + attributeToString(t),
            dataType: "json",
            success: function(t) {
                "function" == typeof r ? r(t) : Shopify.onCartUpdate(t)
            },
            error: function(t, r) {
                Shopify.onError(t, r)
            }
        };
        jQuery.ajax(e)
    }, "1.4" <= jQuery.fn.jquery ? Shopify.param = jQuery.param : (Shopify.param = function(t) {
        var e = [],
            r = function(t, r) {
                r = jQuery.isFunction(r) ? r() : r, e[e.length] = encodeURIComponent(t) + "=" + encodeURIComponent(r)
            };
        if (jQuery.isArray(t) || t.jquery) jQuery.each(t, function() {
            r(this.name, this.value)
        });
        else
            for (var o in t) Shopify.buildParams(o, t[o], r);
        return e.join("&").replace(/%20/g, "+")
    }, Shopify.buildParams = function(e, t, o) {
        jQuery.isArray(t) && t.length ? jQuery.each(t, function(t, r) {
            rbracket.test(e) ? o(e, r) : Shopify.buildParams(e + "[" + ("object" == typeof r || jQuery.isArray(r) ? t : "") + "]", r, o)
        }) : null != t && "object" == typeof t ? Shopify.isEmptyObject(t) ? o(e, "") : jQuery.each(t, function(t, r) {
            Shopify.buildParams(e + "[" + t + "]", r, o)
        }) : o(e, t)
    }, Shopify.isEmptyObject = function(t) {
        for (var r in t) return !1;
        return !0
    });
})()