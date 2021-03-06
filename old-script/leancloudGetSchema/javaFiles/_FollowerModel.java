package com.hankkin.leancloud.model;

import android.text.TextUtils;

import com.avos.avoscloud.AVFile;

import java.io.Serializable;

import java.util.Map;

public class _FollowerModel implements Serializable{

    public _Follower(){super();}
   /*!
    * @brief 对象更新时间
   */
    private MyDate updatedAt;
    /*!
   * @brief 对象创建时间
   */
    private MyDate createdAt;
   /*!
    * @brief 对象数据库id
    */
    private String objectId;
   /*!
    * @brief follower
   */
    private _UserModel follower;
   /*!
    * @brief user
   */
    private _UserModel user;

  public MyDate getUpdatedAt(){return updatedAt;}

  public void setUpdatedAt(MyDate updatedAt){this.updatedAt=updatedAt;}

  public MyDate getCreatedAt(){return createdAt;}

  public void setCreatedAt(MyDate createdAt){this.createdAt=createdAt;}

  public String getObjectId(){return objectId;}

  public void setObjectId(String objectId){this.objectId=objectId;}

  public _UserModel getFollower(){return follower;}

  public void setFollower(_UserModel follower){this.follower=follower;}

  public _UserModel getUser(){return user;}

  public void setUser(_UserModel user){this.user=user;}

}