package com.onlyyours.repository;

import com.onlyyours.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Integer> {
    
    List<Question> findByCategory_Id(Integer categoryId);
    
    @Query("SELECT q FROM Question q WHERE q.category.id = :categoryId ORDER BY RANDOM()")
    List<Question> findRandomByCategory_Id(@Param("categoryId") Integer categoryId);
}
