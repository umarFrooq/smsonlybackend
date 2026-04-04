const config = require('@/config/config');

const credentials = {
    api_key : config.leopards.apiKey,
    api_password : config.leopards.apiPassword
}

const placeOrderPayload = {
    ...credentials,
        booked_packet_weight: '',
        booked_packet_no_piece: '',
        booked_packet_collect_amount: '',
        booked_packet_order_id: '',
        origin_city: '',
        destination_city: '',
        shipment_name_eng: '',
        shipment_email: '',
        shipment_phone: '',
        shipment_address: '',
        consignment_name_eng: '',
        consignment_email: '',
        consignment_phone: '',
        consignment_address: '',
        special_instructions: '' 
}


module.exports = {
    credentials,
    placeOrderPayload
}