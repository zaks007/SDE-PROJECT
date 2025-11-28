package org.example;

import jakarta.persistence.EntityManager;

public class Test {
    public static void main(String[] args) {
        EntityManager em = JPAUtil.getEntityManager();
        em.getTransaction().begin();

        User user = new User();
        user.setName("Goodness");

        em.persist(user);
        em.getTransaction().commit();
        em.close();

        System.out.println("Garden saved successfully!");
    }
}

