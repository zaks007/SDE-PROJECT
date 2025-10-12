package org.example;

import javafx.fxml.FXML;
import org.example.User;
import org.example.JPAUtil;
import jakarta.persistence.EntityManager;

public class MainController {
    @FXML
    private void initialize() {

    }

    //My first push!!!
    //Goodness's push!!
    public void registerUser(String name, String role) {
        EntityManager em = JPAUtil.getEntityManager();
        em.getTransaction().begin();

        User user = new User(name, role);
        em.persist(user);

        em.getTransaction().commit();
        em.close();
    }
}