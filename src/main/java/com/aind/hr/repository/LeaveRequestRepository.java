package com.aind.hr.repository;

import com.aind.hr.model.entity.LeaveRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LeaveRequestRepository {

    List<LeaveRequest> selectAll();

    List<LeaveRequest> selectByEmployeeId(@Param("employeeId") Integer employeeId);

    LeaveRequest selectById(@Param("id") Integer id);

    int insert(LeaveRequest leaveRequest);
}
