package com.abes.ordermanagement.service;

import com.abes.ordermanagement.entity.OrderItem;

import java.util.List;

public interface OrderItemService {

    List<OrderItem> getAllOrderItems();

    OrderItem getOrderItemById(Long id);

    OrderItem createOrderItem(OrderItem orderItem);

    OrderItem updateOrderItem(Long id, OrderItem orderItem);

    void deleteOrderItem(Long id);
}
